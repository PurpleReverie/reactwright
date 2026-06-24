# NeurIPS 2025 reference style files

The official NeurIPS 2025 style files this template is matched against —
kept here so the rendered output can be diffed against the authoritative
visual spec.

| File | What it is |
|------|------------|
| `neurips_2025.pdf` | The compiled example. **This is the visual spec** — every formatting rule the template targets is illustrated here. |
| `neurips_2025.sty` | The LaTeX style file (exact geometry, font sizes, title rules, abstract/heading/caption rules). |
| `neurips_2025.tex` | The shell document, including the verbatim 16-question Paper Checklist. |

## Source

Downloaded from the official NeurIPS site:

    https://media.neurips.cc/Conferences/NeurIPS2025/Styles.zip

The NeurIPS style files are distributed by the conference for preparing
submissions; they are bundled here for reference only.

## How to compare

Rasterize this reference and the rendered sample to per-page PNGs and eyeball
them side by side:

```sh
# from the repo root
node scripts/pdf-to-images.mjs packages/template-neurips/reference/neurips_2025.pdf --dpi 150
node scripts/pdf-to-images.mjs build/examples/neurips-sample.pdf --dpi 150
```

> **Note on fidelity.** The reference is typeset by `pdflatex` with LaTeX's
> Times (`ptm` / Nimbus Roman); the template renders via Chromium / Paged.js
> with `'Times New Roman'`. Layout and formatting match the spec, but glyph
> metrics — and therefore exact line breaks and pagination — differ from a
> real LaTeX build. Compare *format*, not line-for-line text flow.

## Packaging

This folder is **development-only**. The package's `files` allowlist
(`src`, `LICENSE`, `README.md`) excludes it, so the reference PDF is **not**
published to npm.
