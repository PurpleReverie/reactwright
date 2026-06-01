# @reactwright/code-highlight

> **Not yet implemented.** This package is a placeholder; it is
> marked `private` in `package.json` and is not published to npm.
> Track status in the GitHub issue tracker:
> https://github.com/PurpleReverie/reactwright/issues

Syntax-highlighting integration for Reactwright code blocks. When
shipped, it will wrap Shiki (or Prism) at content-tree reconciliation
time so `<code-block language="ts">…</code-block>` emits coloured
tokens in the final HTML and PDF.

## Planned shape

```tsx
import { highlightCode } from "@reactwright/code-highlight";

// in your template wrapper or content tree
<code-block language="ts">{highlightCode(source, "ts")}</code-block>
```

Until then, `<code-block language="ts">` renders plain monospaced
text without colour. The `language` attribute is preserved in the
HTML, so a downstream highlighter can be wired in by hand.
