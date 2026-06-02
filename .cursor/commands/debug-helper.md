---
description: Diagnose errors, stack traces, and logs; rank root causes and propose a safe fix
---

Debug helper for errors, stack traces, and logs.

## Input (any of)
- Paste the error / stack trace directly
- Recent terminal output will be checked if available
- Auto-scan common log files: `*.log`, `logs/`, `tmp/`

## Output
1. **Likely Root Causes** — ranked by probability
2. **Clarifying Questions** — max 5 to narrow down
3. **Next Debugging Actions** — concrete steps to investigate

If the root cause is identified:
- **Safe Fix** — minimal change to resolve
- **Rollback Notes** — how to revert if needed

## Project-specific gotchas to check first
- Camera not starting → not a secure context (must be localhost or https), or permission denied
- Black/empty detections → model not finished loading, or overlay canvas size ≠ `video.videoWidth/Height`
- Slow first load → the ~26 MB ONNX wasm runtime downloading; it caches after first load
- WebGPU errors → confirm the browser supports it; the WASM fallback should engage automatically
