import "reactdoc/jsx";

import type { ContentComponent, TemplateComponent } from "reactdoc";
import { ArticleTemplate } from "reactdoc/templates";

export const Template: TemplateComponent = () => <ArticleTemplate />;

const Paper: ContentComponent = () => (
  <document title="Consumer Paper" author="Tauraj Greig">
    <abstract>
      <p>
        This file proves TypeScript can understand ReactDoc <em>intrinsics</em> from another project.
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
