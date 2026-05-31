# examples/story-bible

The single best end-to-end smoke test in the repo. One document, three
distinct page regimes routed via `<page-set>`:

- `chapter` — A5 two-sided novel pages with running head, page
  numbers, Lora serif, drop caps.
- `portrait` — A5 full-bleed plate pages, no margins, no chrome.
- `script` — A5 screenplay pages with a Courier-style face.

Exercises regime routing, role rules, drop caps, running strings,
two-sided geometry, and external font loading.

## Run it

```sh
pnpm --filter @example/story-bible mockup
```

Outputs `build/mockups/story-bible.{html,pdf}` (~3s).
