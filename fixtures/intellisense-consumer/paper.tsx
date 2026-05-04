import "reactdoc/jsx";

import type { ContentComponent, TemplateComponent } from "reactdoc";
import { ArticleTemplate } from "reactdoc/templates";

export const Template: TemplateComponent = () => <ArticleTemplate />;

const Paper: ContentComponent = () => (
  <document title="Consumer Paper" author="Tauraj Greig">
    <abstract>
      <paragraph>This file proves TypeScript can understand ReactDoc intrinsics from another project.</paragraph>
    </abstract>

    <section title="Introduction">
      <paragraph>Hello from a consumer-style fixture.</paragraph>
    </section>
  </document>
);

export default Paper;
