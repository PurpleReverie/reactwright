---
"@reactwright/template-neurips": minor
---

New package: `@reactwright/template-neurips` — a NeurIPS 2025 single-column
conference-paper template matched to the official `neurips_2025.sty` /
`neurips_2025.pdf` style files.

- US Letter, 5.5in × 9in centered text block, Times 10pt justified body
  with no first-line indent.
- 17pt bold title between a 4pt/1pt rule pair; centered multi-author block
  (bold name, regular affiliation/address, monospace email) via
  `<meta name="author">` + `authorMetas`.
- Centered bold "Abstract" heading with the paragraph indented 0.5in on
  both margins.
- Arabic-numbered bold section headings (1, 1.1, 1.1.1) wired with dialect
  counters; References / Acknowledgments / Checklist excluded from
  numbering by role.
- "Figure N:" / "Table N:" auto-numbered captions; booktabs-style tables;
  author-year (APA) references with a hanging indent; indented block quotes.
- Appendix support: top-level sections lettered A, B with "A.1" subsections
  (mixed alpha/decimal numbering via the dialect `prefix` concept).
- `NeurIPSChecklist` + `CHECKLIST_QUESTIONS` emit the required Paper
  Checklist (verbatim 2025 wording, 16 questions) as a page-broken,
  unnumbered, plain numbered list.
- First-page conference notice configurable via the `notice` prop
  (defaults to the camera-ready track line; `"Preprint."` or `""` also
  accepted).

Adds `examples/neurips-sample`, a Markdown-authored paper rendered to PDF
through the template.
