# @reactwright/charts

> **Not yet implemented.** This package is a placeholder; it is
> marked `private` in `package.json` and is not published to npm.
> Track status in the GitHub issue tracker:
> https://github.com/PurpleReverie/reactwright/issues

SVG chart primitives (`<bar-chart>`, `<line-chart>`, `<scatter>`)
for Reactwright documents. When shipped, charts will render to inline
SVG at content-tree reconciliation time so the output paginates and
prints cleanly under headless Chromium.

## Planned shape

```tsx
import { BarChart } from "@reactwright/charts";

<figure>
  <BarChart data={[…]} x="month" y="count" />
  <caption>Monthly build counts.</caption>
</figure>
```

Until then, generate charts to PNG or SVG with a separate tool and
include them via `<figure src="./chart.svg" />`.
