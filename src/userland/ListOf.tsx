import "reactwright/jsx";
import React from "react";

// Userland `<ListOf>` helper (slice 6.4). The `<list-of-data>`
// primitive aggregates `ctx.listOf[of]` and exposes
// `{ id, caption }[]` to the render-prop. The leader-line page-number
// column reuses the engine-internal `reactwright-list-of-*` classes
// (their `STATIC_DEFAULTS_CSS` rules supply the same flex layout +
// target-counter wiring as the deprecated `<list-of>` compound).
export function ListOf({
  of,
  title
}: {
  of: "figure" | "table" | "equation";
  title?: string;
}): React.ReactElement {
  return (
    <list-of-data of={of}>
      {(entries) => (
        <section title={title ?? ""} role={`list-of-${of}`}>
          <list ordered>
            {entries.map((e) => (
              <item key={e.id} className="reactwright-list-of-entry">
                <p>
                  <link href={`#${e.id}`} className="reactwright-list-of-link">
                    {e.caption}
                  </link>
                  <link href={`#${e.id}`} className="reactwright-list-of-page" />
                </p>
              </item>
            ))}
          </list>
        </section>
      )}
    </list-of-data>
  );
}
