---
description: Assess hackathon demo readiness for the Cursor Madrid vision hackathon
---

Review this project for **hackathon demo readiness**. The Cursor Madrid Hack #3 is
a ~2.5h vision hackathon judged on a working prototype shown in a 2-3 minute demo —
shipping something functional matters more than polish.

## Review Process

### 1. Does it run?
```bash
npm run build
```
- Does `npm run dev` start cleanly? Does the core flow (camera → detection → boxes) work end to end?
- Any console errors during a live run?

### 2. Demo story (2-3 min)
- Is there a single, clear "wow" moment that reads on a projector?
- Can it be triggered reliably without fiddling? (camera permission, model preloaded)
- Failure modes during a live demo: bad lighting, conference wifi, no GPU — are they handled or avoided?

### 3. Vision theme execution
- Which theme axis does it hit (detection / tracking / segmentation / generation)?
- Is the use of the vision model meaningful, not just a passthrough?

### 4. Code & docs quality (lightweight)
- README: can a judge run it in under 2 minutes?
- Is the code readable enough to skim during Q&A?

## Output Format

### Demo Readiness: [Ready / Needs Work / At Risk]

### What lands
- Strongest demoable moments

### Risks before demo
- Anything that could break or confuse on stage, ranked by likelihood

### Top 3 highest-leverage fixes
- Concrete, time-boxed (each doable in the remaining time)
