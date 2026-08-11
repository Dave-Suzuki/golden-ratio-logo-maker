# Kiwari 木割 — every logo shows its work

A logo & icon tool where every mark is **constructed, not generated**. You describe what you
want in one sentence; a deterministic geometry engine builds nine marks on real proportion
systems — φ circle chains, golden-rectangle subdivisions, pentagonal symmetry, √2 modular
grids (大和比). Every mark can dissolve into its own construction: the circles, the lattice,
the labeled ratios, and plain-language reasoning. **No image model ever touches the mark.**

The LLM (Claude) is a *planner*, never a renderer: it emits a `ConstructionPlan` in a closed
DSL, and a deterministic TypeScript engine validates the φ-invariants — every radius is
r₀·φⁿ, every anchor is a lattice point, every rotation is whitelisted — and rejects illegal
plans. Model quality improves the ideas; it cannot degrade the craft.

## Layout

```
packages/engine     @kiwari/engine — pure TS geometry engine (deps: paper, zod)
  src/schema        BrandBrief / ConstructionPlan DSL / ParamDelta (zod)
  src/lattice       golden-subdivision, pentagonal, √2-grid address spaces
  src/validate.ts   the structural φ-invariant gate
  src/render        Paper.js booleans, optical-correction layer, reveal geometry
  src/generate      seeded fallback planner: 4 template families, diversity matrix
  src/refine        applyDelta (constraints hold) + NL-edit verb lexicon
apps/web            Next.js studio
  src/lib/ai        Claude structured-output interpreter/planner/editor + repair loop
  src/app           studio, /is-this-real (honesty page), /sheet (construction sheet)
```

## Run it

```sh
npm install
npm run dev            # http://localhost:3000
```

Works fully **without an API key** — a deterministic rule-based interpreter and seeded plan
templates drive everything (the UI labels it "template engine"). To let Claude plan:

```sh
export ANTHROPIC_API_KEY=sk-ant-...
# optional: export KIWARI_MODEL=claude-opus-5   (the default)
```

Same brief + same seed always reproduces the identical marks, on either path.

## Verify

```sh
npm test               # engine: 62 tests — lattice math, validator rejections,
                       #   φ-invariants over seeded batches, determinism, diversity
npm test -w @kiwari/web  # AI services: mocked-Claude repair loop, fallback switching
npm run typecheck
npm run build
```

## Honesty layer

The golden ratio is not a law of beauty, and this product does not claim it is — see
`/is-this-real` in the app (shipped in the MVP, linked from every construction reveal).
Optical corrections are a separate, labeled layer that can always be toggled off to show
the pure mathematical state. The bundled wordmark typeface (Fraunces) is SIL OFL and is
outlined to paths on export.
