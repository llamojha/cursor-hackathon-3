# Vision Hack3 — LibreYOLO live detection

Browser webcam → live object detection with [`libreyolo-web`](https://github.com/LibreYOLO/libreyolo-web)
(MIT-licensed, runs on WebGPU with a WASM fallback). Built as a starter blueprint
for the Cursor Madrid Hackathon #3 (vision theme).

## Run

```bash
npm install
npm run dev
```

Open the printed `http://localhost:5173`, pick a model, click **Start camera**,
and allow camera access. (Camera + WebGPU require a secure context — localhost
qualifies.)

## Build / deploy

```bash
npm run build      # -> dist/  (static, deploy to Vercel)
npm run preview    # preview the production build
```

`vercel.json` sets COOP/COEP headers so threaded WASM/WebGPU work in production
(the dev server sets the same headers in `vite.config.ts`).

Model weights are **self-hosted**, not downloaded from HuggingFace in the
visitor's browser. `scripts/fetch-models.mjs` runs as a `prebuild`/`predev` hook
(and `npm run fetch-models`) to pull the ONNX weights into `public/models/` at
build time, so the browser loads them same-origin. This avoids a cross-origin
runtime fetch that COEP isolation and flaky CDN access can break in production.

## How it works

- `src/main.ts` — loads a model with `loadModel()`, grabs the webcam, then runs a
  `requestAnimationFrame` loop calling `model.predict(video)` and drawing results
  with `BoxOverlay`.
- Models come from `listModels()` (e.g. `LibreYOLOXn`, `LibreYOLO9s`,
  `LibreRFDETRm`). `LibreYOLOXn` is the fast default.

## Where to take it (hackathon ideas)

- **Tracking** — assign stable IDs to boxes across frames.
- **Counting / zones** — count objects crossing a line or inside a region.
- **Segmentation / generation** — swap in a seg model or pipe detections into a
  generative step.

## Cursor workspace config

- `AGENTS.md` — always-on agent instructions.
- `.cursor/rules/vision.mdc` — auto-attached rules for `src/**/*.ts`.
- `.cursor/rules/typescript.mdc` — agent-requested TS conventions.
- `.cursor/mcp.json` — Context7 MCP for live library docs.
- `.cursor/commands/*.md` — slash commands (ported & adapted from a Kiro setup):
  - `/brainstorm` — ideate vision features within the time budget
  - `/debug-helper` — rank root causes, propose a safe fix (with project gotchas)
  - `/commit-message` — Conventional Commits message for staged changes
  - `/prime` — load project context
  - `/demo-review` — assess hackathon demo readiness
