import "reactwright/jsx";

import type { ContentComponent, TemplateComponent } from "reactwright";

export const Template: TemplateComponent = () => (
  <page style={{ size: "a4", margin: "25mm", fontFamily: "serif", fontSize: "11pt" }}>
    <stack gap="6mm">
      <region style={{ textAlign: "center" }}>
        <slot name="title" />
        <slot name="author" />
      </region>
      <region>
        <slot name="abstract" />
      </region>
      <region>
        <slot name="body" />
      </region>
    </stack>
  </page>
);

const IntelliSenseTest: ContentComponent = () => (
  <document title="IntelliSense Playground" author="Anya Strunk">
    <section role="abstract" title="">
      <p>
        This playground file exists to prove that the package-facing JSX types work
        in normal TSX authoring.
      </p>
    </section>

    <section title="Introduction">
      <p>
        If this file type-checks cleanly, then ReactDoc intrinsics are available
        through the public IntelliSense surface.
      </p>
    </section>
  </document>
);

export default IntelliSenseTest;
