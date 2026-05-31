export function ResearchMemo() {
  return (
    <document title="Reactive Document Systems" author="Anya Strunk">
      <section role="abstract" title="">
        <p>
          A project-scoped example showing that content and template can both live
          outside the Reactwright engine internals.
        </p>
      </section>

      <section title="Why This Matters">
        <p>
          Real users need to shape both their document semantics and their
          presentation without patching the engine itself.
        </p>
      </section>

      <section title="Observation">
        <p>
          A local project can define its own template component and still use the
          same Reactwright pipeline.
        </p>
      </section>
    </document>
  );
}
