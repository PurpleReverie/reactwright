export default function Paper() {
  return (
    <document title="Playground Paper" author="Anya Strunk">
      <section role="abstract" title="">
        <p>This file lives outside the normal src examples and runs through the local Reactwright runtime.</p>
      </section>

      <section title="Introduction">
        <p>Hello from the playground runner.</p>
      </section>

      <section title="Why This Exists">
        <p>This file exercises Reactwright on a real TSX file before the package is consumed externally.</p>
      </section>
    </document>
  );
}
