# ReactDoc — Project Instructions

ReactDoc is a React-authored document engine for paginated output (HTML via Paged.js, PDF via headless Chromium).

## Architecture at a glance

```
content JSX ──[render.ts]──► contentIR
template JSX ──[render.ts]──► templateIR
                              ↓
                        [resolve.ts] ──► ResolvedPageNode
                              ↓
                        [html/render.ts] ──► HTML
                              ↓
                        Paged.js ──► PDF (via puppeteer-core)
```

Two independent React reconcilers (content + template) produce intermediate representations. Resolver merges them by substituting `<slot>` with content regions. HTML backend emits for Paged.js (CSS Paged Media + GCPM polyfill).

## Key modules

| File | Purpose |
|------|---------|
| `src/content/render.ts` | JSX→contentIR: semantic blocks (section, p, figure, etc.) |
| `src/template/render.ts` | JSX→templateIR: layout primitives (page, stack, region, page-set, etc.) |
| `src/resolver/resolve.ts` | contentIR + templateIR → ResolvedPageNode (joins via slots) |
| `src/resolver/ir.ts` | ResolvedPageNode type (source of truth for resolved tree) |
| `src/backends/html/render.ts` | ResolvedPageNode → HTML for Paged.js (1500 lines; see sections below) |
| `src/backends/pdf/render.ts` | HTML → PDF (headless Chromium, file:// URLs for images) |

## Key patterns

**Page-set (regime declaration):**
A `<page-set name="X">` declares one CSS Paged Media regime: geometry (size, margin), chrome (header/footer), and body flow template. Its `<slot name="body">` is a marker. When resolver processes it, body flow gets stored in `regimeFlows[X]` and chrome is hoisted as direct page children. At render time, each `<section page="X">` is wrapped in its regime's flow template.

**Role rules (semantic routing):**
`<role match="X" apply="Y" style={...} breakBefore="...">` maps content `role="X"` to presentation variant `Y`. Style pass-through lets templates define what variants look like without engine baking in role names.

**Running strings (`<set>` + `<running>`):**
Content: `<set running="chapter-title" value="..." />` captures metadata. Template: `<running name="chapter-title" />` emits it. Wired via CSS string-set + margin boxes.

**Body-stream auto-emit:**
If no top-level `<slot name="body">` consumes body content but page-sets registered flows, the resolver appends a synthetic `body-stream` node. Lets authors wire content by placing slot inside page-set alone.

## Where to add / modify

| Task | Files |
|------|-------|
| New content primitive | `src/content/ir.ts` + `src/content/render.ts` + resolver slot handling |
| New template primitive | `src/template/ir.ts` + `src/template/render.ts` + resolver + `src/backends/html/render.ts` |
| New page-set behavior | `src/resolver/resolve.ts` (page-set case) + `src/resolver/ir.ts` (regimeFlows type) |
| CSS Paged Media details | `src/backends/html/render.ts` (buildPageRegimesCss, buildMarginMatterCss, etc.) |
| Styling / directMap | `src/backends/html/render.ts` (styleToInlineCss directMap) |

## Testing / validation

- **Unit tests:** `npm run test` (47 tests in `tests/*.test.tsx`)
- **Integration tests:** `npm run mockup:all` (renders 9 mockups; PDFs are live validation)
- **Type check:** `npm run check`

All 9 mockups must produce healthy PDFs. Check file sizes: if a PDF drops to ~900B, that regime's content was filtered out (likely a resolver bug).

## Spec vs. source

**The spec (`docs/spec.md`) is canonical.** When spec and code disagree, trust the spec. Recent refactorings (page-set as pure declaration, body-stream auto-emit) have aligned source closer to spec intent.

## Key recent changes (last commit)

- Deleted `ResolvedPageSetNode` from flow tree (page-sets now hoist chrome, store body flow).
- Removed `matchesPageSet` filtering (body-slot no longer groups content by regime; document order preserved).
- Added `regimeFlows: Record<string, ResolvedChild[]>` on `ResolvedPageNode` (per-regime body templates).
- Added `body-stream` auto-emit so writers can place `<slot name="body">` inside `<page-set>` intuitively.
- Section wrapping in regime templates happens at render time (`renderSectionNode` checks `regimeFlows`).

## Context-saving notes

- Don't re-read spec; trust it over code when they conflict.
- `npm run mockup:all` is fast (~3s); use it after structural changes.
- Audit by PDF file size. A 900B PDF means content was silently dropped (resolver bug).
- `regimeFlows` map is the key novel piece; everything else follows from it.
