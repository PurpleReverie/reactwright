import "reactwright/jsx";
import React from "react";

// Userland `<Toc>` helper (slice 6.4). Composes the `<toc-data>`
// data-source render-prop with content primitives. The leader-line
// page-number column is rendered via the engine-internal classes
// `reactwright-toc-link` + `reactwright-toc-page`, whose
// `STATIC_DEFAULTS_CSS` rules supply `display:flex;
// justify-content:space-between;` + `::after{content:target-counter(
// attr(href url), page)}` respectively. The userland helper is thus
// a thin composition wrapper over engine machinery — no new CSS
// scaffold needed.
export function Toc({
  title = "Contents"
}: { title?: string } = {}): React.ReactElement {
  return (
    <toc-data>
      {(entries) => (
        <section title={title} role="toc">
          <list ordered>
            {entries.map((e) => (
              <item key={e.id} className="reactwright-toc-entry">
                <p>
                  <link href={`#${e.id}`} className="reactwright-toc-link">
                    {e.title}
                  </link>
                  <link href={`#${e.id}`} className="reactwright-toc-page" />
                </p>
              </item>
            ))}
          </list>
        </section>
      )}
    </toc-data>
  );
}
