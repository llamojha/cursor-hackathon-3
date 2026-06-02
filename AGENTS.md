# Agent instructions — Vision Hack3

This is a browser-based computer-vision app for the Cursor Madrid Hackathon #3
(theme: image/video — detection, tracking, segmentation, generation).

## Stack
- Vite + vanilla TypeScript (no framework — keep it lean for fast iteration).
- `libreyolo-web` for in-browser object detection (MIT-licensed, runs on
  WebGPU with WASM fallback). High-level API: `loadModel`, `model.predict`,
  `BoxOverlay`, `listModels`.
- Camera via `navigator.mediaDevices.getUserMedia`.

## Conventions
- Prefer the high-level libreyolo-web API over manual ONNX/tensor code.
- Keep the detection loop on `requestAnimationFrame`; never block the main thread.
- Camera + WebGPU require a secure context (localhost or https).
- Deploy target is Vercel (static build: `npm run build` -> `dist/`).

## When extending
- Tracking: persist detection IDs across frames before reaching for a heavy lib.
- New model: add it via the `#model` dropdown (driven by `listModels()`).

## Cursor workspace
- Rules: `.cursor/rules/vision.mdc` (UI + `src/`), `.cursor/rules/typescript.mdc` (request for TS refactors).
- Slash commands: `.cursor/commands/` — `/prime`, `/brainstorm`, `/debug-helper`, `/commit-message`, `/demo-review`.
- MCP: `.cursor/mcp.json` enables Context7 for up-to-date library docs (enable project MCP in Cursor settings).
- Production deploy needs COOP/COEP headers (see `vercel.json`; dev server sets them in `vite.config.ts`).
