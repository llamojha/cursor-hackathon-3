# “Is this a date?” score — specification

**Status:** Draft  
**Theme:** Dating (party-game / self-aware humor)  
**Stack:** Existing Vision Hack3 app (`src/main.ts`, `libreyolo-web`, webcam, `BoxOverlay`)  
**Target effort:** ~45–90 min MVP · ~2–3 h polished demo

---

## 1. Summary

A live **0–100 “date energy” score** derived from objects the webcam sees each frame. The score updates smoothly while the camera runs, paired with a short **roast / praise line** that explains the vibe in one sentence.

This is a **parody party feature**, not a real dating or safety product. Copy and UI must make that obvious (“for laughs”, “point at your table”, not “rate your partner”).

---

## 2. Goals

| Goal | Detail |
|------|--------|
| **Instant demo** | Judge sees score move within 2 s of starting the camera. |
| **No backend** | 100% client-side; works on localhost and Vercel static deploy. |
| **Cheap per frame** | Only counting and math on `result.detections`; no extra model loads. |
| **Stable readout** | Smoothed score so the number doesn’t jitter every frame. |
| **Funny, kind tone** | Roasts are self-deprecating or situational, never insulting a real person in frame. |

### Non-goals (v1)

- Face recognition, gender inference, or “attractiveness” scoring.
- Storing images, user accounts, or sharing to social APIs (optional v2: export PNG).
- Requiring exactly two faces or two `person` boxes (detection is unreliable).
- Multi-language copy (English only for hackathon).

---

## 3. User experience

### 3.1 Flow

1. User opens app, selects model (default `LibreYOLOXn` is fine), clicks **Start camera**.
2. After detections run, a **Date score** panel appears (always visible once running, or toggled — see UI).
3. User points camera at a scene (desk, kitchen, two people at a table, etc.).
4. **Score** (0–100) and **tier label** update ~2–4× per second (smoothed).
5. **Roast line** changes when tier changes or on a slow rotate among lines in the same tier.

### 3.2 UI elements

Add to `index.html` / `src/style.css` (placement: below controls or beside the stage):

| Element | ID (suggested) | Behavior |
|---------|----------------|----------|
| Score value | `#date-score` | Integer 0–100, large type |
| Tier label | `#date-tier` | Short label, e.g. “Study session” |
| Roast line | `#date-roast` | One sentence, smaller type |
| Optional meter | `#date-meter` | Simple horizontal bar fill = score % |
| Disclaimer | `#date-disclaimer` | Static: “Parody score from objects in frame — not serious advice.” |

**Visual tiers (color optional):**

| Score range | Tier label (example) |
|-------------|----------------------|
| 0–24 | Solo mission |
| 25–49 | Situationship energy |
| 50–74 | Could be a date |
| 75–100 | Main character date |

Do not block the video; keep overlay boxes as today.

### 3.3 Copy guidelines

- Address the **scene** or **user** (“This table…”, “You brought…”), not “the person on the left”.
- Avoid body/appearance commentary.
- Phone/laptop jokes are about **behavior**, not moral judgment.

---

## 4. Scoring model

### 4.1 Inputs

Each frame, after `model.predict(video)`:

- Use `result.detections` (array of detections with **class label** and **confidence**).
- Ignore detections below **confidence threshold** `τ = 0.35` (tunable; avoid noise).

**Implementation note:** Log one detection object on first frame to confirm field names (`class`, `label`, `name`, etc.) and normalize to a string key for rules.

### 4.2 COCO classes used

Weights assume COCO-style names from the detector. Map aliases if the library differs (e.g. `wine_glass` → `wine glass`).

| Class | Role |
|-------|------|
| `person` | Social / “not alone” signal |
| `cup`, `bowl` | Casual food/drink |
| `wine glass`, `bottle` | “Going out” drink vibe |
| `dining table` | Sit-down context (weak signal) |
| `cell phone` | Anti-date (distracted) |
| `laptop` | Anti-date (work / WFH) |
| `book` | Neutral / intellectual date |
| `potted plant` | Cozy aesthetic (optional easter egg) |
| `couch` | Netflix vibe (optional) |

Other classes are ignored for scoring in v1.

### 4.3 Per-frame raw score

Start from baseline **50** (“ambiguous”), then apply capped deltas from **counts** in the current frame (after τ filter):

| Signal | Condition | Δ (points) | Cap |
|--------|-----------|------------|-----|
| Social | `person` count ≥ 1 | +8 per person | +20 max |
| Social bonus | `person` count ≥ 2 | +10 extra | once |
| Drinks (soft) | any of `cup`, `bowl` | +6 each | +12 max |
| Drinks (datey) | any of `wine glass`, `bottle` | +10 each | +20 max |
| Table | `dining table` ≥ 1 | +8 | once |
| Cozy | `potted plant` ≥ 1 | +5 | once |
| Work | `laptop` ≥ 1 | −18 | once |
| Phone | `cell phone` ≥ 1 | −12 | once |
| Phone pile-on | `cell phone` ≥ 2 | −8 extra | once |
| Intellectual | `book` ≥ 1 | +5 | once |
| Couch potato | `couch` ≥ 1 and no `wine glass` | −6 | once |

Clamp raw score to **[0, 100]**.

**Design intent**

- **High score:** people + drinks, no laptop/phone dominance.
- **Low score:** laptop + phone, zero people.
- **Mid score:** one person + cup (coffee “date?”).

### 4.4 Smoothing

Exponential moving average on the **raw** score before display:

```
displayScore = α * rawScore + (1 - α) * displayScore
```

- `α = 0.15` (~6–7 frames to settle at 30 fps effective update).
- Round `displayScore` to integer for UI.
- Roast/tier evaluate from **smoothed** score, not raw.

### 4.5 Tier + roast selection

- **Tier** = bucket from smoothed score (table in §3.2).
- **Roast** = pick one line from tier pool; **change roast only when tier changes** OR every **8 s** while tier is stable (avoid flickering text).

#### Roast pools (minimum 2 per tier; expand in polish pass)

**Solo mission (0–24)**

- “Zero date energy detected. Just you and your obligations.”
- “This is a meeting with your to-do list wearing a hoodie.”

**Situationship energy (25–49)**

- “Coffee’s here. Commitment is still loading.”
- “Could go either way — like your ‘we should hang out sometime.’”

**Could be a date (50–74)**

- “Drinks, humans, no spreadsheet — suspicious in a good way.”
- “If this is a date, you’re doing the props right.”

**Main character date (75–100)**

- “Wine glass energy. The montage is filming itself.”
- “High date probability. Phones are losing this round.”

**Contextual overrides** (optional v1.1; if implemented, they replace tier roast when true):

| Condition | Line |
|-----------|------|
| `laptop` ≥ 1 && `wine glass` ≥ 1 | “PowerPoint and pinot — the corporate rom-com.” |
| `cell phone` ≥ 2 | “Everyone brought a plus-one: their screen.” |
| `person` === 0 && `cup` ≥ 1 | “It’s you and the cup. The cup is trying its best.” |

---

## 5. Technical design

### 5.1 Module layout

Keep `main.ts` thin; add focused modules:

```
src/
  main.ts              # loop: predict → overlay → dateScore.update(detections)
  date-score.ts        # scoring, smoothing, tier/roast logic
  date-score-copy.ts   # roast strings + tier labels (optional split)
```

### 5.2 Public API (`date-score.ts`)

```ts
export type DateScoreSnapshot = {
  score: number;       // 0–100 smoothed
  tierId: string;      // e.g. "situationship"
  tierLabel: string;   // display
  roast: string;
};

export function createDateScore(): {
  update(detections: DetectionLike[], now?: number): DateScoreSnapshot;
  reset(): void;
};

type DetectionLike = {
  label: string;       // normalized class name
  confidence: number;
};
```

- `update` called once per successful `predict` in the existing `loop()`.
- `reset` on camera stop / model reload (if loop restarts).

### 5.3 Integration point (`main.ts`)

Inside `loop()`, after `overlay.draw(result.detections)`:

```ts
const snapshot = dateScore.update(result.detections);
renderDateScoreUI(snapshot); // sets text on #date-score, #date-tier, #date-roast
```

Do not `await` anything extra in the loop beyond existing `predict`.

### 5.4 Detection adapter

```ts
function normalizeLabel(d: unknown): string;
function countByClass(detections: DetectionLike[], τ: number): Map<string, number>;
```

If `libreyolo-web` exposes a typed `Detection`, use it; otherwise narrow safely from runtime shape.

### 5.5 Performance

- Scoring must stay **&lt; 1 ms** per frame (simple counts).
- No allocations hot path if easy (reuse `Map` or plain object); not required for MVP.

---

## 6. Edge cases

| Case | Behavior |
|------|----------|
| No detections | Score drifts toward baseline 50; roast tier “Situationship” or show “Point camera at the scene” until first detection |
| Model loading / error | Hide score panel or show “—”; don’t crash loop |
| Single `person` blob for two people | Don’t require 2 boxes; social bonus is best-effort only |
| False `cell phone` | τ + smoothing prevents one-frame spikes; optional require phone box &gt; 0.5 s before max penalty (v1.1) |
| User covers camera | Score decays via EMA toward previous; no special case |
| Model switch mid-run | `dateScore.reset()` on model change handler |

---

## 7. Accessibility & demo

- Score and roast in text (screen reader can read `#date-score` + `#date-roast`).
- Don’t rely on color alone for tier (label + number).
- For live demo: prepare **three physical setups** — (1) laptop only, (2) cup + phone, (3) two people + cups/glasses.

---

## 8. Implementation phases

### Phase A — MVP (~45–90 min)

- [ ] `date-score.ts` with raw + EMA score, tier, static roast per tier
- [ ] UI block + disclaimer in `index.html` / `style.css`
- [ ] Wire into `loop()` in `main.ts`
- [ ] Log detection shape once; fix label normalization

### Phase B — Polish (~1–2 h extra)

- [ ] Contextual roast overrides
- [ ] Roast rotation every 8 s within tier
- [ ] Meter bar + tier colors
- [ ] Tune τ and weights using real webcam scenes

### Phase C — Stretch (out of scope unless time)

- [ ] Screenshot export with score overlay
- [ ] “Phone down” streak sub-feature
- [ ] Sound effect on tier up

---

## 9. Test plan

| Test | Expected |
|------|----------|
| Empty room | Score ~40–55 after settle; no crash |
| Laptop open | Score drops &lt; 40 within ~2 s |
| Cup in frame, no person | Mid-tier roast |
| Two people + bottles | Score &gt; 70 |
| Rapid pan | Smoothed score changes gradually |
| Model dropdown change | Score resets without stuck roast |
| Production build `npm run build && npm run preview` | Same behavior; COOP/COEP unchanged |

Manual only for hackathon; no automated tests required v1.

---

## 10. Constants (tunable)

| Constant | Default | Notes |
|----------|---------|--------|
| `CONFIDENCE_THRESHOLD` | `0.35` | Raise if noisy |
| `EMA_ALPHA` | `0.15` | Lower = smoother |
| `ROAST_ROTATE_MS` | `8000` | Optional |
| `BASELINE_SCORE` | `50` | Neutral prior |

Document changes in PR/commit if tuned for demo night.

---

## 11. Open questions

1. **Exact detection schema** from `libreyolo-web` — confirm on first implement frame.
2. **Panel visibility** — always on when running vs. collapsible (default: always on).
3. **Show contributing signals in debug** — e.g. small “+wine glass −laptop” chips for dev (off in demo).

---

## 12. References

- App entry: `src/main.ts`
- Agent conventions: `AGENTS.md`, `.cursor/rules/vision.mdc`
- Hackathon README ideas: counting/zones, tracking (not required for v1)
