# Rate limiting — specification

**Status:** Draft
**Scope:** Roast Match backend (`guille/server/`)
**Stack:** Express 5, Node ESM, OpenAI SDK; deploy target Vercel
**Target effort:** ~30–45 min MVP · ~2–3 h hardened

---

## 1. Summary

The Roast Match API exposes `POST /api/roast/validate`, which calls the OpenAI
Chat Completions API **on every request** (`guille/server/roast.js`). There is
currently **no rate limiting, no authentication, and no client identity** beyond
the network IP. Anyone can script the endpoint in a loop and:

- burn the project's OpenAI budget (each call = real tokens, real money),
- exhaust the OpenAI account's own rate limit and take the app down,
- brute-force roasts against a profile to extract its phone number (the success
  path returns `result.phone`).

This spec adds a layered rate limit: a **cheap global/IP guard on all routes**
plus a **stricter, more expensive guard on the OpenAI-backed `/validate`
endpoint**.

---

## 2. Goals

| Goal | Detail |
|------|--------|
| **Protect the wallet** | Cap how often any single client can trigger an OpenAI call. |
| **Stay up under abuse** | A burst from one IP must not exhaust the shared OpenAI quota for everyone. |
| **Cheap to run** | No new infra for the MVP — in-process limiter, zero external deps beyond one well-known package. |
| **Honest responses** | Return HTTP `429` with `Retry-After` and a JSON body the frontend can render. |
| **Tunable** | Limits come from env vars so they can change without a redeploy of logic. |

### Non-goals (v1)

- User accounts / API keys (no auth layer exists yet).
- Per-user billing or quotas.
- Distributed/global accuracy across many serverless instances (see §6 caveat).
- Blocking determined attackers behind rotating IPs (that's a WAF/Cloudflare job).

---

## 3. Where it plugs in

```
client → Express app (guille/server/index.js)
           app.use(cors())
           app.use(express.json(...))
       ┌─→ [NEW] global limiter        ← all routes, cheap
       │   app.use('/api/roast', roastRouter)
       │       GET  /profiles          ← global limiter only
       │       GET  /profiles/:id      ← global limiter only
       └─→     POST /validate          ← [NEW] strict limiter + global
                   └→ validateRoast() → OpenAI call ($$)
```

Two tiers:

1. **Global limiter** — mounted in `index.js` before the router. Catches
   scraping of the read endpoints and forms a coarse ceiling.
2. **Validate limiter** — mounted only on the `POST /validate` route in
   `roast-routes.js`, because that's the only path that spends money.

---

## 4. Design

### 4.1 Approach: token bucket / fixed window, in-process

For the MVP use [`express-rate-limit`](https://github.com/express-rate-limit/express-rate-limit)
(single dependency, ~zero config, battle-tested with Express 5). It keys by IP
using a fixed/sliding window counter held in memory.

Two limiter instances:

| Limiter | Window | Max / window | Keyed by | Mounted at |
|---------|--------|--------------|----------|------------|
| `globalLimiter` | 1 min | 60 | client IP | `app.use(...)` in `index.js` |
| `validateLimiter` | 1 min | 8 | client IP | `POST /validate` route |

Numbers are **defaults**, overridable by env (see §4.4). The validate limit is
deliberately tight because each request is an OpenAI call; 8/min is plenty for a
human writing roasts, hostile for a script.

### 4.2 Client identity (the IP problem)

On Vercel / behind any proxy, `req.ip` is the proxy's IP unless Express trusts
the forwarding header. We must:

- set `app.set('trust proxy', 1)` in `index.js` so `req.ip` reflects the real
  client via `X-Forwarded-For`,
- rely on `express-rate-limit`'s default IP key generator (which respects
  `trust proxy`).

Without this, **all traffic looks like one IP** and either everyone is limited
together or the limit is trivially bypassed.

### 4.3 Response contract

On limit exceeded, return:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 23
RateLimit-Limit: 8
RateLimit-Remaining: 0
RateLimit-Reset: 23
Content-Type: application/json

{
  "ok": false,
  "error": "rate_limited",
  "message": "Demasiados intentos. Espera un momento antes de volver a roastear.",
  "retryAfterSeconds": 23
}
```

- `standardHeaders: true` emits the `RateLimit-*` headers; `legacyHeaders: false`.
- The Spanish `message` matches the app's existing tone and is safe to show in
  the UI.

### 4.4 Configuration (env vars)

Add to `guille/.env.example`:

```
# Rate limiting (all optional; values are the defaults)
RATE_LIMIT_GLOBAL_WINDOW_MS=60000
RATE_LIMIT_GLOBAL_MAX=60
RATE_LIMIT_VALIDATE_WINDOW_MS=60000
RATE_LIMIT_VALIDATE_MAX=8
```

A limiter module reads these with sane fallbacks so a missing `.env` still works
in dev.

### 4.5 New / changed files

| File | Change |
|------|--------|
| `guille/server/rate-limit.js` | **New.** Exports `globalLimiter` and `validateLimiter`, built from env config. |
| `guille/server/index.js` | Add `app.set('trust proxy', 1)`; `app.use(globalLimiter)` before the router. |
| `guille/server/roast-routes.js` | Import `validateLimiter`; apply it as middleware on `POST /validate`. |
| `guille/package.json` | Add `express-rate-limit` dependency. |
| `guille/.env.example` | Document the four new env vars. |
| `guille/README.md` | One line noting the endpoint is rate limited + how to tune. |

### 4.6 Sketch

`guille/server/rate-limit.js`:

```js
import rateLimit from 'express-rate-limit';

const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

const rateLimited = (req, res) =>
  res.status(429).json({
    ok: false,
    error: 'rate_limited',
    message: 'Demasiados intentos. Espera un momento antes de volver a roastear.',
    retryAfterSeconds: Math.ceil((req.rateLimit?.resetTime - Date.now()) / 1000) || 60,
  });

export const globalLimiter = rateLimit({
  windowMs: num(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS, 60_000),
  max: num(process.env.RATE_LIMIT_GLOBAL_MAX, 60),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimited,
});

export const validateLimiter = rateLimit({
  windowMs: num(process.env.RATE_LIMIT_VALIDATE_WINDOW_MS, 60_000),
  max: num(process.env.RATE_LIMIT_VALIDATE_MAX, 8),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimited,
});
```

`guille/server/roast-routes.js` (delta):

```js
import { validateLimiter } from './rate-limit.js';
// ...
roastRouter.post('/validate', validateLimiter, async (req, res) => { /* unchanged */ });
```

`guille/server/index.js` (delta):

```js
import { globalLimiter } from './rate-limit.js';
// ...
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(globalLimiter);
app.use('/api/roast', roastRouter);
```

---

## 5. Frontend handling

The client (`guille/src/roast-match.ts`) should treat `429` as a soft, expected
state, not a crash:

- detect `res.status === 429`, read `retryAfterSeconds` (or the `Retry-After`
  header),
- show the `message`, disable the submit button, and re-enable after the
  countdown.

This is optional for the MVP (the server is protected regardless) but makes the
demo feel intentional.

---

## 6. Caveat: serverless state

`express-rate-limit`'s default store is **in-memory per process**. On Vercel,
each serverless instance has its own counter, and instances scale out under
load — so the *effective* limit is `max × instanceCount`, and counters reset on
cold start. For a hackathon / single-box deploy this is fine. To make the limit
**global and accurate**, swap the store for a shared backend without touching
the limiter logic:

- **Upstash Redis** + `rate-limit-redis` (serverless-friendly, free tier), or
- `@upstash/ratelimit` directly if we drop `express-rate-limit`.

Recommended path: ship the in-memory MVP now; add the Redis store behind the
same `rate-limit.js` module if/when the app runs on real, multi-instance infra.

---

## 7. Defense-in-depth (related, out of scope for this change)

These are surfaced by the same investigation but are separate tasks:

- **Phone-number leak:** `POST /validate` returns `result.phone` on success with
  no ownership check. Rate limiting slows brute force but doesn't fix the leak —
  consider gating contact reveal differently.
- **CORS is wide open** (`cors()` with no origin allowlist). Restrict to the
  deployed frontend origin in production.
- **Body size:** `express.json({ limit: '12mb' })` is large for a text roast
  capped at 1200 chars; a tighter limit on the validate route reduces abuse
  surface.

---

## 8. Acceptance criteria

- [ ] 9th `POST /api/roast/validate` within a minute from one IP returns `429`
      with `Retry-After` and the JSON body in §4.3 — **before** any OpenAI call.
- [ ] Read endpoints still serve normally under the higher global limit.
- [ ] Limits are configurable via the four env vars; defaults apply when unset.
- [ ] `req.ip` reflects the real client behind a proxy (`trust proxy` set).
- [ ] A legitimate user writing one roast every few seconds is never limited.
- [ ] No change to the success/failure response shape of `validateRoast`.

---

## 9. Rollout

1. Add dependency + `rate-limit.js`, wire into `index.js` and `roast-routes.js`.
2. Test locally: loop `curl` the validate endpoint, confirm `429` after the cap.
3. Set env vars in the Vercel project (or accept defaults).
4. (Optional) Add the frontend `429` countdown handling.
5. (Later) Swap to a Redis store if the deploy becomes multi-instance.
