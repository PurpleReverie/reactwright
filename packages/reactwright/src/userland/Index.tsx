import "reactwright/jsx";
import React from "react";

// Userland `<Index>` helper (slice 6.4). The `<index-data>` primitive
// aggregates `ctx.indexEntries` and yields per-term `{ term,
// anchorIds }` rows (sorted locale-aware by term). Each rendered
// item carries the engine-internal `reactwright-index-pagerefs`
// class on its paragraph so the `STATIC_DEFAULTS_CSS`
// `a + a::before{content:', '}` rule inserts comma separators
// between page-number anchors, matching the deprecated `<index>`
// compound.
export function Index({
  title = "Index"
}: { title?: string } = {}): React.ReactElement {
  return (
    <index-data
      render={(entries) => {
        if (entries.length === 0) return null;
        return (
          <section title={title} role="index">
            <list>
              {entries.map((e) => (
                <item key={e.term}>
                  <p className="reactwright-index-pagerefs">
                    {e.term}{" "}
                    {e.anchorIds.map((id) => (
                      <link
                        key={id}
                        href={`#${id}`}
                        className="reactwright-index-pageref"
                      />
                    ))}
                  </p>
                </item>
              ))}
            </list>
          </section>
        );
      }}
    />
  );
}
