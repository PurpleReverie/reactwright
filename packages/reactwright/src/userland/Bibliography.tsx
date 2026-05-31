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
  return (
    <bib-data>
      {(entries) => (
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
      )}
    </bib-data>
  );
}
