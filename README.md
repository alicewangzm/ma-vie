# Alice's Wonderland 🐾☁️

> An interactive 3D story-portfolio. A small cat wanders a cloud kingdom where
> every island is a chapter of Alice Wang's life — sometimes the road ahead is
> clear, sometimes the view is blocked.

<!-- TODO(stage-3): hero GIF -->

**Live:** _preview link coming after first deploy_

Built in 2 days with Vite + TypeScript + vanilla Three.js. No React, no frameworks.

## Architecture — chained story blocks

The experience is a linked chain of self-contained modules. Adding a chapter
means adding **one file** and one `director.register(...)` line — nothing else
changes.

```
                 ┌────────────────────── Director ──────────────────────┐
                 │  register(...) · start() · next() · update(dt, t)    │
                 └──┬────────────┬────────────┬────────────┬────────────┘
   cloud-wipe ⇄     ▼            ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ block00  │→│ block01  │→│ block02  │→│   ...    │
              │ letter   │ │ who is   │ │ journey/ │ │          │
              └──────────┘ │ alice    │ │ storm    │ └──────────┘
                           └──────────┘ └──────────┘
                 each: preload → enter → update… → exit → dispose
```

- **`StoryBlock`** (`src/core/StoryBlock.ts`) — `preload / enter / update / exit / dispose`
  lifecycle. Blocks are lazy: the module itself is only `import()`ed when needed.
- **`Director`** (`src/core/Director.ts`) — sequencer. On `next()` it overlaps the next
  block's module load + asset preload with the cloud-wipe closing, so cuts feel instant.
- **`WorldContext`** (`src/core/WorldContext.ts`) — shared world handed to every block:
  scene, camera rig, cat controller, audio bus, environment, progress store, and the
  global `dreamFactor` uniform.

## Rendering techniques

- **Billboard clouds, not raymarching.** Volumetric raymarching burns fragment budget
  quadratically with overdraw; on a mid-tier laptop it can't hold 60 fps alongside bloom.
  Instead: one `InstancedMesh` (≈130–300 quads, one draw call) with a custom
  `ShaderMaterial`. Billboarding, drift, and wraparound run in the vertex shader —
  zero per-frame CPU work. Fragments **depth-fade at intersections** (classic soft
  particles) against a depth prepass, so clouds never produce hard cut lines through
  the hill or props.
- **`dreamFactor` uniform** — one global 0→1 dial shared by the sky and cloud shaders:
  desaturates toward luminance, lifts fog, adds a slow flicker. Reality is saturated;
  envisioned futures are faded and gently blinking.
- **Selective-by-threshold bloom** — a single `UnrealBloomPass` with a high threshold so
  only the sun core and glow sprites bloom. <!-- TODO(stage-3): layer-based selective bloom if budget allows -->
- **Sky** — gradient shader on an inverted sphere; colors are uniforms, so blocks lerp
  time-of-day (the Google block goes pre-sunrise pink → storm grey).

## Performance budget & results

| Budget                      | Target | Measured       |
| --------------------------- | ------ | -------------- |
| Initial JS payload (gzip)   | < 2 MB | _TODO stage-3_ |
| Frame rate, mid-tier laptop | 60 fps | _TODO stage-3_ |
| Lighthouse (perf)           | ≥ 90   | _TODO stage-3_ |

- Adaptive DPR: a frame-time watchdog steps `renderer.setPixelRatio` down
  (2 → 1.5 → 1.25 → 1) if sustained frame times sag below 50 fps.
- Mobile: fewer cloud instances (130 vs 300) and a lower DPR cap; degrade, never crash.
- **Dispose strategy:** every block frees its geometries, materials, and textures in
  `dispose()`; the Director guarantees `exit → dispose` before the next `enter`.
  Verified with `renderer.info` profiling. <!-- TODO(stage-3): dispose audit results -->

## Scaling — adding a chapter

1. Create `src/blocks/blockNN-your-chapter.ts` exporting `createBlock(): StoryBlock`.
2. Register it: `director.register({ id, load: () => import('./blocks/blockNN-...') })`.

That's it. Vite code-splits each block into its own lazy chunk automatically.

## Pipeline

```
git commit ──► husky pre-commit (eslint --fix + prettier via lint-staged)
     │
     └─ push ──► GitHub Actions: lint ──► test (vitest) ──► build   (correctness gate)
           └──► Cloudflare Pages: npm run build ──► dist ──► edge   (delivery)
                      └─ every push gets its own preview URL
```

**Why Cloudflare Pages over GitHub Pages:** the build is fully static (zero server
runtime), so the host is purely a delivery question. Cloudflare serves from its edge
CDN with proper cache-control for the heavy payloads this project ships (GLB cat
model, cloud/texture atlases) — GitHub Pages sits behind a single-tier cache with
`max-age=600` and no per-asset tuning. And Cloudflare's per-push **preview
deployments** give every commit a shareable URL, which is how visual changes get
reviewed here: look at the preview, then promote. GitHub Pages deploys one branch
to one URL — no preview gating.

## Credits & inspiration

- _Sky: Children of the Light_ (thatgamecompany) — tonal inspiration only; every asset
  here is procedural or original, zero copied assets.
- Story & copy: Alice Wang. Engineering: built pair-programming with Claude.

---

_Envisioned by a human. Accelerated by AI. Every decision deliberate._
