export function ResearchMemo() {
  return (
    <document title="Reactive Document Systems" author="Tauraj Greig">
      <abstract>
        <p>
          A project-scoped example showing that content and template can both live
          outside the ReactDoc engine internals.
        </p>
      </abstract>

      <section title="Why This Matters">
        <p>
          Real users need to shape both their document semantics and their
          presentation without patching the engine itself.
        </p>
      </section>

      <section title="Observation">
        <p>
          A local project can define its own template component and still use the
          same ReactDoc pipeline.
        </p>
      </section>
    </document>
  );
}
