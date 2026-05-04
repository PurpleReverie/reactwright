export function ResearchMemo() {
  return (
    <document title="Reactive Document Systems" author="Tauraj Greig">
      <abstract>
        <paragraph>
          A project-scoped example showing that content and template can both live
          outside the ReactDoc engine internals.
        </paragraph>
      </abstract>

      <section title="Why This Matters">
        <paragraph>
          Real users need to shape both their document semantics and their
          presentation without patching the engine itself.
        </paragraph>
      </section>

      <section title="Observation">
        <paragraph>
          A local project can define its own template component and still use the
          same ReactDoc pipeline.
        </paragraph>
      </section>
    </document>
  );
}
