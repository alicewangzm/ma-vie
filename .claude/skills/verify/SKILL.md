---
name: verify
description: Verify ma-vie (3D story-portfolio) changes by driving the real app with Playwright
---

# Verifying ma-vie

Browser 3D app (Three.js). Surface = pixels + interactions in a real browser.

## Recipe that works

1. `npm run dev` (background) → http://localhost:5173/
2. Playwright, **headed only**: `chromium.launch({ headless: false })`.
   Headless uses software WebGL here and runs ~1–2 fps — the cloud-wipe
   takes ~20s to open and every fixed timeout misleads you into thinking
   the app is stuck on a pink screen. It isn't; it's just slow.
3. Dev-only hook `window.__wonderland = { director, ctx, wipe }` (main.ts,
   guarded by `import.meta.env.DEV`). Use it to:
   - wait on real state, never fixed sleeps:
     `w.wipe.progress < 0.05`, `w.director.currentId === 'block0X-…'`
   - step chapters: `w.director.next()`
   - read cat position to assert walking worked
4. Click the letter by projecting its world pos (0, 11, 4) through
   `ctx.camera` to screen px — don't guess pixel coords.
5. Story flow: letter click → `.wl-accept` button → chapters advance via
   beacons (or `director.next()` for smoke). Screenshot each block.

## Gotchas

- Console 404s in headed runs = missing favicon (headless doesn't fetch it).
- Scene is deliberately washed-out near the sun; not a rendering bug.
- Working smoke script pattern: see session scratchpad `smoke.mjs` idea —
  poll `waitForFunction` on the hook, screenshot per chapter, collect
  `pageerror` + `console.error`.
