# examples/newsletter

Multi-column newsletter layout with inline template. Exercises
`<columns widths={["2fr","1fr"]}>` with `<column>` children, inline
`<img>` in body, `<br>`/`<sub>`/`<sup>`, a `<layer>` for a page-wide
tint, and `<fixed>` for masthead overlay.

## Run it

```sh
pnpm --filter @example/newsletter mockup
```

Outputs `build/mockups/newsletter.{html,pdf}`.
