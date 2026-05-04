import "reactdoc/jsx";

import { ArticleTemplate } from "reactdoc/templates";
import type { ContentComponent, TemplateComponent } from "reactdoc";

export const Template: TemplateComponent = () => <ArticleTemplate />;

const IntelliSenseTest: ContentComponent = () => (
  <document title="IntelliSense Playground" author="Tauraj Greig">
    <abstract>
      <paragraph>
        This playground file exists to prove that the package-facing JSX types work
        in normal TSX authoring.
      </paragraph>
    </abstract>

    <section title="Introduction">
      <paragraph>
        If this file type-checks cleanly, then ReactDoc intrinsics are available
        through the public IntelliSense surface.
      </paragraph>
    </section>
  </document>
);

export default IntelliSenseTest;
