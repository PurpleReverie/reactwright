import "reactwright/jsx";
import React from "react";

// Userland `<Bibliography>` helper (slice 6.3, D1, D10). Composes
// engine primitives via the `<bib-data>` data-source render-prop —
// no engine "bibliography compound" knowledge. The render-prop
// returns content JSX (the data-source resolver re-enters the
// content reconciler, slice 6.3 path A).
//
// Cross-reference contract — ID format + counter name — survives:
//   • each entry's `<item id="reactwright-bib-{key}">` is the
//     citation anchor target.
//   • the section carries `counter="reactwright-bib"`, which the
//     renderer emits as `data-counter="reactwright-bib"` on the
//     `<section>` element.
//   • `STATIC_DEFAULTS_CSS` defines counter-reset / counter-increment
//     rules keyed on the `[data-counter="reactwright-bib"]` selector,
//     so `target-counter(attr(href url), reactwright-bib)` on cites
//     resolves to `[1]`, `[2]`, … the same way it did under the
//     deprecated engine `<bibliography>` intrinsic.
export function Bibliography({
  title = "References"
}: { title?: string } = {}): React.ReactElement {
  // Pass the render function as a `render` prop rather than via
  // children — passing functions through `children` triggers React's
  // "Functions are not valid as a React child" warning at every
  // render. The engine still accepts the legacy children form, so
  // user code that passes the function as a child continues to work.
  return (
    <bib-data
      render={(entries) => {
        // RW-5 / RW-7: when no `<refs>` block was supplied, the
        // resolver hands us an empty `entries` array. Suppress the
        // entire bibliography section in that case so authors who
        // skip refs don't see an orphan "Works Cited" / "References"
        // heading on a blank trailing page.
        if (entries.length === 0) return null;
        return (
          <section title={title} role="bibliography" counter="reactwright-bib">
            <list ordered>
              {entries.map((e) => (
                <item key={e.key} id={`reactwright-bib-${e.key}`}>
                  <p>
                    <bib-entry-content for={e.key} />
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
