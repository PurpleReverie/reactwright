import "reactwright/jsx";

import type { ContentComponent, TemplateComponent } from "reactwright";

// Consumers ship their own templates. The engine only provides primitives.
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

const Paper: ContentComponent = () => (
  <document title="Consumer Paper" author="Anya Strunk">
    <abstract>
      <p>
        This file proves TypeScript can understand Reactwright <em>intrinsics</em> from another project.
      </p>
    </abstract>

    <section title="Introduction">
      <p>
        Hello from a consumer-style fixture with <strong>inline formatting</strong>.
      </p>
      <list ordered>
        <item>
          <p>First numbered item.</p>
        </item>
        <item>
          <p>Second numbered item.</p>
        </item>
      </list>
    </section>
  </document>
);

export default Paper;
