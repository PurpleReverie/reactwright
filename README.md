# ReactDoc — Spec v0.1

---

**Core Idea**

A document authoring system where content is written as a React component tree and rendered to any output format via swappable class providers. The content tree is semantic — it describes *what* the document contains. The class layer describes *how* it renders. Swapping the class layer changes the output format without touching the content.

---

**1. Content Primitives**

The atomic building blocks. Every document is composed of these.

```tsx
// Text primitives
<Text>plain prose</Text>
<Em>emphasis</Em>
<Strong>bold</Strong>
<Code>inline code</Code>
<Math>x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}</Math>

// Block primitives  
<Paragraph>...</Paragraph>
<BlockQuote>...</BlockQuote>
<CodeBlock language="python">...</CodeBlock>
<MathBlock>...</MathBlock>

// Reference primitives
<Cite keys={["smith2020", "jones2021"]} />
<Ref label="fig:pipeline" />
<Footnote>additional context here</Footnote>

// Asset primitives
<Figure
  src="figs/pipeline.pdf"
  caption="Our pipeline."
  label="fig:pipeline"
/>
<Table
  data={rows}
  caption="Results."
  label="tab:results"
/>
<Listing
  src="code/model.py"
  caption="Model definition."
  language="python"
  label="lst:model"
/>
```

Rules:
- All primitives are output-agnostic — no styling, no format assumptions
- Labels are always explicit — never auto-generated from content
- Math content is always raw LaTeX string — renders via KaTeX in browser, passes through on LaTeX export
- Asset paths are relative to a declared asset root

---

**2. Structure Primitives**

Organise content into hierarchy.

```tsx
// Document shell
<Document
  title="Attention Is All You Need"
  authors={["Vaswani", "Shazeer"]}
  abstract="We propose a new architecture..."
  keywords={["transformers", "attention", "NLP"]}
  date="2024-01"
/>

// Sections — nest arbitrarily
<Section title="Introduction" label="sec:intro">
  <Paragraph>...</Paragraph>
  <Section title="Contributions" label="sec:contributions">
    ...
  </Section>
</Section>

// Front matter
<Abstract>...</Abstract>
<Keywords>transformers, attention, NLP</Keywords>
<Acknowledgements>...</Acknowledgements>

// Back matter
<Bibliography src="refs.bib" />
<Appendix title="Proofs" label="app:proofs">...</Appendix>
```

---

**3. Semantic Primitives**

Domain-specific blocks that carry meaning beyond formatting.

```tsx
// Academic
<Theorem label="thm:main" name="Universal Approximation">
  For any continuous function f...
</Theorem>

<Proof>
  By induction on the depth...
</Proof>

<Definition label="def:attention" name="Scaled Dot-Product Attention">
  Given queries Q, keys K, values V...
</Definition>

<Lemma label="lem:bound">...</Lemma>
<Corollary label="cor:result">...</Corollary>
<Remark>...</Remark>
<Example>...</Example>

// D&D
<StatBlock name="Ancient Dragon" cr={20}>
  <Stat name="HP" value={350} />
  <Stat name="AC" value={22} />
  <Action name="Multiattack">...</Action>
  <LegendaryAction>...</LegendaryAction>
</StatBlock>

<ReadAloud>
  The cavern opens into a vast chamber...
</ReadAloud>

<Encounter difficulty="deadly">
  <Monster ref="ancient-dragon" count={1} />
  <Monster ref="kobold" count={8} />
</Encounter>

// Legal
<Clause number="4.2" title="Indemnification">...</Clause>
<Definition term="Confidential Information">...</Definition>
<Signature party="Client" />
```

New domains = new semantic primitives. They compose with the same base primitives.

---

**4. Class Layer**

A class is a dictionary mapping primitive names to render functions for a specific output target. One class per output format per venue.

```ts
// Class interface — every class implements this
type DocumentClass = {
  // Structure
  Document: Renderer<DocumentProps>;
  Section: Renderer<SectionProps>;
  Paragraph: Renderer<ParagraphProps>;

  // Text
  Em: Renderer<EmProps>;
  Strong: Renderer<StrongProps>;
  Math: Renderer<MathProps>;
  MathBlock: Renderer<MathBlockProps>;

  // References
  Cite: Renderer<CiteProps>;
  Ref: Renderer<RefProps>;
  Figure: Renderer<FigureProps>;
  Table: Renderer<TableProps>;

  // Semantic
  Theorem: Renderer<TheoremProps>;
  Definition: Renderer<DefinitionProps>;
  // ... etc
};

type Renderer<TProps> = (props: TProps) => string | JSX.Element;
```

---

**5. Built-in Classes**

```ts
// LaTeX targets
import { IEEEClass } from 'reactdoc/classes/ieee';
import { ACMClass } from 'reactdoc/classes/acm';
import { LNCSClass } from 'reactdoc/classes/lncs';
import { ThesisClass } from 'reactdoc/classes/thesis';

// Web targets
import { HTMLClass } from 'reactdoc/classes/html';
import { ObsidianClass } from 'reactdoc/classes/obsidian';

// Other
import { DocxClass } from 'reactdoc/classes/docx';
import { PlainTextClass } from 'reactdoc/classes/plaintext';

// Domain specific
import { DnDHandoutClass } from 'reactdoc/classes/dnd-handout';
import { DnDVTTClass } from 'reactdoc/classes/dnd-vtt';
```

Adding a new class = one file, implement the interface. No changes to content.

---

**6. ClassProvider**

Injects the class into the tree via context. Every primitive reads from it.

```tsx
// Render to IEEE LaTeX
<ClassProvider class={IEEEClass}>
  <MyPaper />
</ClassProvider>

// Render to HTML
<ClassProvider class={HTMLClass}>
  <MyPaper />
</ClassProvider>

// Render to D&D handout PDF
<ClassProvider class={DnDHandoutClass}>
  <DragonHeist />
</ClassProvider>

// Custom class — override just the parts you need
const MyThesisClass = {
  ...ThesisClass,
  Theorem: ({ name, children }) =>
    `\\begin{theorem}[${name}]\n${children}\n\\end{theorem}`
};

<ClassProvider class={MyThesisClass}>
  <MyThesis />
</ClassProvider>
```

---

**7. Bibliography**

`.bib` is the source of truth. Always.

```tsx
// Declare once at document root
<Document bib="refs.bib">
  ...
</Document>

// Cite by key anywhere in the tree
<Cite keys={["vaswani2017", "brown2020"]} />

// In browser — looks up parsed bib, renders formatted citation
// On LaTeX export — emits \cite{vaswani2017,brown2020}
// Bibliography style comes from the class, not the content
```

Bib parser runs at build time. Keys are validated — missing keys are caught before export, not during LaTeX compilation.

---

**8. Numbering and Cross-References**

All numbering is managed by the framework, never by the author.

```tsx
// Author declares label, framework assigns number
<Figure label="fig:pipeline" caption="Our pipeline." src="..." />

// Author references label, framework resolves to number
<Ref label="fig:pipeline" />
// → "Figure 3" in HTML
// → \ref{fig:pipeline} in LaTeX (resolves during compilation)

// Sections, theorems, equations, tables — same pattern
<Section label="sec:methods" title="Methods">
  <MathBlock label="eq:loss">L = -\sum y \log \hat{y}</MathBlock>
  See <Ref label="eq:loss" /> for the loss function.
</Section>
```

---

**9. Renderers**

Two renderers ship by default.

```ts
// Browser renderer — React DOM, live preview
import { renderToDOM } from 'reactdoc/renderers/dom';

renderToDOM(
  <ClassProvider class={HTMLClass}>
    <MyPaper />
  </ClassProvider>,
  document.getElementById('root')
);

// Static renderer — walks tree, emits string
import { renderToString } from 'reactdoc/renderers/static';

const latex = renderToString(
  <ClassProvider class={IEEEClass}>
    <MyPaper />
  </ClassProvider>
);

fs.writeFileSync('paper.tex', latex);
```

Static renderer walks the component tree depth-first. Each primitive calls its class renderer and returns a string. Parent concatenates children strings. Root returns the complete document.

---

**10. Build Pipeline**

```
npm run preview     → React DOM render, hot reload, browser
npm run build:ieee  → static render → paper-ieee.tex → pdflatex → paper-ieee.pdf
npm run build:acm   → static render → paper-acm.tex  → pdflatex → paper-acm.pdf
npm run build:html  → static render → paper.html
npm run build:docx  → static render → paper.docx
```

One content tree. One command per target. No manual reformatting.

---

**11. Project Structure**

```
/my-paper
  /content
    index.tsx          ← root document component
    introduction.tsx
    methods.tsx
    results.tsx
    conclusion.tsx
  /assets
    /figs
    /tables
  /classes
    my-thesis.ts       ← custom class overrides if needed
  refs.bib
  package.json
```

---

**12. Custom Domain Example — D&D**

```tsx
// content/dragon-heist.tsx
const DragonHeist = () => (
  <Document title="Waterdeep: Dragon Heist">

    <Chapter title="The Yawning Portal" label="ch:tavern">
      <ReadAloud>
        The smell of stale ale hits you as you push through the door.
      </ReadAloud>

      <StatBlock name="Durnan" cr={9}>
        <Stat name="HP" value={75} />
        <Stat name="AC" value={16} />
        <Action name="Longsword">+7 to hit, 1d8+4 slashing</Action>
      </StatBlock>

      <Encounter difficulty="medium">
        <Monster ref="thug" count={3} />
        <Monster ref="bandit-captain" count={1} />
      </Encounter>

      <Treasure>
        <Item ref="potion-of-healing" count={2} />
        <Gold amount={50} />
      </Treasure>
    </Chapter>

  </Document>
);

// Build targets
npm run build:handout   → parchment PDF for players
npm run build:dm        → detailed DM reference PDF
npm run build:vtt       → JSON import for Roll20 / Foundry
npm run build:obsidian  → linked markdown for your notes
```

Same content. Four outputs. Zero reformatting.

---

**Open Questions for v0.2**

- How do classes handle primitives they don't recognise — error, warn, or passthrough?
- Multi-file documents — how do imports work across content files?
- Versioning — how do you diff two versions of the same document?
- Collaboration — multiple authors editing the same content tree?
- How does the ReactAgent harness compose with ReactDoc — agent produces content tree, ReactDoc renders it?

---

**What this is not**

- Not a markdown replacement — it is more structured, not less
- Not a LaTeX replacement — it compiles to LaTeX for final typesetting
- Not opinionated about editor — write in any IDE, preview in browser
- Not a hosted platform — runs locally, outputs files you own
