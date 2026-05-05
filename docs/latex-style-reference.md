# LaTeX Style Reference

This document is a practical styling reference for ReactDoc.

It is not a claim that ReactDoc `v0` supports every item here. It is a catalog of LaTeX styling and layout concepts that may inform:

- the template intrinsic vocabulary
- the public style API
- backend mapping decisions
- what belongs in `v0`, later `v1`, or much later

The goal is to make LaTeX breadth visible while keeping the eventual React-facing API intuitive and CSS-inspired.

See also [docs/latex-to-intrinsic-mapping.md](/Users/taurajgreig/Projects/Personal/react_doc/docs/latex-to-intrinsic-mapping.md), which maps this feature catalog onto a proposed intrinsic surface for the content layer, template layer, and template rules.

## Notes

- "Public API name" is the likely ReactDoc style key or concept.
- "Typical LaTeX implementation" is intentionally implementation-oriented, not exhaustive.
- "Priority" is a planning signal, not a promise.
- "Scope" means:
  - `v0`: likely needed for initial proof
  - `v1`: useful soon after core pipeline works
  - `later`: valid, but not needed early

## Page and Document Geometry

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Paper size | `size` | `"a4"` | document class option or `\geometry{a4paper}` | `geometry` | High | v0 |
| Orientation | `orientation` | `"portrait"` | document class option or `\geometry{landscape}` | `geometry` | Medium | v1 |
| Margin all sides | `margin` | `"25mm"` | `\geometry{margin=25mm}` | `geometry` | High | v0 |
| Margin top | `marginTop` | `"20mm"` | `\geometry{top=20mm}` | `geometry` | High | v0 |
| Margin right | `marginRight` | `"25mm"` | `\geometry{right=25mm}` | `geometry` | High | v0 |
| Margin bottom | `marginBottom` | `"20mm"` | `\geometry{bottom=20mm}` | `geometry` | High | v0 |
| Margin left | `marginLeft` | `"25mm"` | `\geometry{left=25mm}` | `geometry` | High | v0 |
| Header height | `headerHeight` | `"14pt"` | `\setlength{\headheight}{14pt}` | core length / `fancyhdr` | Low | later |
| Header separation | `headerSpacing` | `"10pt"` | `\setlength{\headsep}{10pt}` | core length / `fancyhdr` | Low | later |
| Footer separation | `footerSpacing` | `"12pt"` | `\setlength{\footskip}{12pt}` | core length / `fancyhdr` | Low | later |
| Text width | `textWidth` | `"150mm"` | `\setlength{\textwidth}{150mm}` | core length | Low | later |
| Text height | `textHeight` | `"230mm"` | `\setlength{\textheight}{230mm}` | core length | Low | later |
| Margin notes width | `marginNoteWidth` | `"18mm"` | `\setlength{\marginparwidth}{18mm}` | core length | Low | later |
| Binding offset | `bindingOffset` | `"8mm"` | `\geometry{bindingoffset=8mm}` | `geometry` | Medium | v1 |
| Two-sided layout | `twoSided` | `true` | document class option `twoside` | class option | Medium | v1 |
| One-sided layout | `twoSided` | `false` | document class option `oneside` | class option | Medium | v1 |
| Column count | `columns` | `2` | document class option or `multicols` environment | class option / `multicol` | Medium | v1 |
| Column gap | `columnGap` | `"8mm"` | `\setlength{\columnsep}{8mm}` | core length / `multicol` | Low | later |

## Typography

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Base font family | `fontFamily` | `"serif"` | `\rmfamily`, class default, or font package | class / font package | High | v0 |
| Sans font family | `fontFamily` | `"sans"` | `\sffamily` or sans package | core / font package | Medium | v1 |
| Monospace family | `fontFamily` | `"mono"` | `\ttfamily` | core | Medium | v1 |
| Specific font selection | `fontFamily` | `"times"` | font package selection | `newtx`, `mathptmx`, etc. | Medium | v1 |
| Base font size | `fontSize` | `"11pt"` | document class option or size command | class option / core | High | v0 |
| Local font size | `fontSize` | `"12pt"` | `\fontsize{12pt}{14pt}\selectfont` or `\large` | core | Medium | v1 |
| Font weight | `fontWeight` | `"bold"` | `\textbf{...}` / `\bfseries` | core | High | v1 |
| Font style | `fontStyle` | `"italic"` | `\textit{...}` / `\itshape` | core | Medium | v1 |
| Small caps | `fontVariant` | `"small-caps"` | `\textsc{...}` | core | Low | later |
| Underline | `textDecoration` | `"underline"` | `\underline{...}` | core | Low | later |
| Strike-through | `textDecoration` | `"line-through"` | `\sout{...}` | `ulem` | Low | later |
| Text color | `color` | `"red"` | `\textcolor{red}{...}` | `xcolor` | Medium | v1 |
| Background highlight | `backgroundColor` | `"yellow"` | `\colorbox{yellow}{...}` | `xcolor` | Low | later |
| Line height | `lineHeight` | `1.4` | `\linespread{1.4}` or `\setstretch{1.4}` | `setspace` | High | v0 |
| Letter spacing | `letterSpacing` | `"0.5pt"` | tracking commands | `microtype` / custom | Low | later |
| Word spacing | `wordSpacing` | `"normal"` | limited direct control | engine / custom | Low | later |
| Hyphenation control | `hyphenation` | `"none"` | `\hyphenpenalty`, `\exhyphenpenalty`, `\sloppy` | core | Low | later |
| Language | `language` | `"english"` | language package setup | `babel` / `polyglossia` | Medium | v1 |
| Ligatures / protrusion | `microtype` | `true` | micro-typography config | `microtype` | Low | later |

## Text Alignment and Paragraph Layout

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Text alignment left | `textAlign` | `"left"` | `flushleft` or ragged-right mode | core / `ragged2e` | Medium | v1 |
| Text alignment center | `textAlign` | `"center"` | `center` environment or `\centering` | core | High | v0 |
| Text alignment right | `textAlign` | `"right"` | `flushright` | core | Medium | v1 |
| Justified text | `textAlign` | `"justify"` | default paragraph mode | core | High | v0 |
| Paragraph indent | `textIndent` | `"2em"` | `\setlength{\parindent}{2em}` | core length | Medium | v1 |
| Paragraph spacing after | `paragraphSpacing` | `"1em"` | `\setlength{\parskip}{1em}` | core length | High | v1 |
| No paragraph indent | `textIndent` | `0` | `\setlength{\parindent}{0pt}` | core length | Medium | v1 |
| Ragged text | `textWrap` | `"ragged"` | `\raggedright` / `\RaggedRight` | core / `ragged2e` | Low | later |
| First-line indent only | `firstLineIndent` | `"2em"` | paragraph length config | core length | Low | later |
| Keep lines together | `keepTogether` | `true` | penalties or boxed content | core / custom | Low | later |
| Widow control | `widowControl` | `2` | `\widowpenalty` | core | Low | later |
| Orphan control | `orphanControl` | `2` | `\clubpenalty` | core | Low | later |

## Spacing and Box Model

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Padding all sides | `padding` | `"6mm"` | boxed environment inner sep | `tcolorbox`, `mdframed`, custom | Medium | v1 |
| Padding top | `paddingTop` | `"4mm"` | box config | `tcolorbox`, custom | Low | later |
| Padding right | `paddingRight` | `"4mm"` | box config | `tcolorbox`, custom | Low | later |
| Padding bottom | `paddingBottom` | `"4mm"` | box config | `tcolorbox`, custom | Low | later |
| Padding left | `paddingLeft` | `"4mm"` | box config | `tcolorbox`, custom | Low | later |
| Margin top | `marginTop` | `"8mm"` | vertical space before block | `\vspace`, environment spacing | High | v1 |
| Margin bottom | `marginBottom` | `"8mm"` | vertical space after block | `\vspace`, environment spacing | High | v1 |
| Margin left | `marginLeft` | `"10mm"` | list/block adjustment or `adjustwidth` | `changepage` / custom | Low | later |
| Margin right | `marginRight` | `"10mm"` | list/block adjustment or `adjustwidth` | `changepage` / custom | Low | later |
| Gap in vertical stack | `gap` | `"6mm"` | inserted vertical space between children | custom compiler logic | High | v0 |
| Inline spacing | `inlineGap` | `"0.5em"` | explicit spacing commands | core | Low | later |
| Page break before | `pageBreakBefore` | `"always"` | `\newpage` / `\clearpage` | core | Medium | v1 |
| Page break after | `pageBreakAfter` | `"always"` | `\newpage` / `\clearpage` | core | Medium | v1 |
| Prevent page break inside | `breakInside` | `"avoid"` | need boxing / penalties | custom / `needspace` | Low | later |

## Borders, Rules, and Backgrounds

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Border all sides | `border` | `"1pt solid black"` | framed box environment | `tcolorbox`, `mdframed`, custom | Medium | v1 |
| Border top | `borderTop` | `"1pt solid"` | rule above content | custom / `tikz` / box env | Low | later |
| Border right | `borderRight` | `"1pt solid"` | box env side rule | `tcolorbox`, custom | Low | later |
| Border bottom | `borderBottom` | `"1pt solid"` | rule below content | custom / box env | Medium | v1 |
| Border left | `borderLeft` | `"1pt solid"` | left rule | box env / custom | Low | later |
| Border color | `borderColor` | `"gray"` | box rule color | `xcolor`, `tcolorbox` | Low | later |
| Border radius | `borderRadius` | `"2mm"` | rounded frame corners | `tcolorbox`, `mdframed` | Low | later |
| Background fill | `backgroundColor` | `"gray!10"` | shaded box background | `xcolor`, `tcolorbox` | Low | later |
| Horizontal rule | `rule` | `"full"` | `\hrule`, `\rule{\linewidth}{...}` | core | Medium | v1 |
| Rule thickness | `ruleThickness` | `"0.4pt"` | `\rule` thickness value | core | Low | later |

## Lists

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Bullet style | `listStyleType` | `"disc"` | `itemize` label config | `enumitem` | Low | later |
| Numbering style | `listStyleType` | `"decimal"` | `enumerate` label config | `enumitem` | Low | later |
| List indent | `listIndent` | `"2em"` | list margin config | `enumitem` | Low | later |
| List item spacing | `itemSpacing` | `"0.5em"` | `itemsep` | `enumitem` | Low | later |
| Compact list | `compact` | `true` | reduce list spacing | `enumitem` | Low | later |

## Section and Heading Styling

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Section numbering | `numbering` | `true` | use numbered section commands | class default | Medium | v1 |
| Section font size | `section.fontSize` | `"14pt"` | heading format config | `titlesec` | Medium | v1 |
| Section font weight | `section.fontWeight` | `"bold"` | heading format config | `titlesec` | Medium | v1 |
| Section alignment | `section.textAlign` | `"center"` | heading format config | `titlesec` | Low | later |
| Section spacing before | `section.marginTop` | `"2em"` | heading spacing config | `titlesec` | Medium | v1 |
| Section spacing after | `section.marginBottom` | `"1em"` | heading spacing config | `titlesec` | Medium | v1 |
| Chapter opening style | `chapterStyle` | `"plain"` | class or package-specific setup | class / `titlesec` / `fncychap` | Low | later |
| TOC depth | `tocDepth` | `2` | `\setcounter{tocdepth}{2}` | core | Low | later |

## Title Blocks and Front Matter

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Title alignment | `title.textAlign` | `"center"` | `\maketitle` customization or custom title block | class / custom | High | v1 |
| Title font size | `title.fontSize` | `"16pt"` | redefine title formatting | class / custom | Medium | v1 |
| Author alignment | `author.textAlign` | `"center"` | title block customization | class / custom | Medium | v1 |
| Abstract heading style | `abstract.headingStyle` | `"smallcaps"` | redefine abstract env/title | class / custom | Low | later |
| Title page separate | `titlePage` | `true` | `titlepage` environment | core | Medium | v1 |
| Front matter numbering style | `frontMatter.numbering` | `"roman"` | page counter style changes | core | Low | later |

## Headers, Footers, and Running Matter

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Header content | `header.content` | `"title"` | running header config | `fancyhdr` | Low | later |
| Footer content | `footer.content` | `"pageNumber"` | footer config | `fancyhdr` | Low | later |
| Page number position | `pageNumber.position` | `"bottom-center"` | header/footer config | `fancyhdr` | Low | later |
| Header rule | `header.rule` | `true` | `\headrulewidth` | `fancyhdr` | Low | later |
| Footer rule | `footer.rule` | `false` | `\footrulewidth` | `fancyhdr` | Low | later |
| Different first page header | `header.firstPage` | `"none"` | page style override | `fancyhdr` / custom | Low | later |

## Multi-Column and Region Layout

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Two-column page | `columns` | `2` | document class option or `multicols` | class / `multicol` | Medium | v1 |
| Column span | `columnSpan` | `"all"` | special commands in two-column docs | class-specific / custom | Low | later |
| Region width | `width` | `"60%"` or `"90mm"` | minipage width / custom layout | `minipage`, `parbox`, custom | Medium | v1 |
| Region max width | `maxWidth` | `"120mm"` | minipage width cap logic | custom | Low | later |
| Horizontal alignment of box | `alignSelf` | `"center"` | center env or horizontal fill logic | core / custom | Low | later |
| Side-by-side blocks | `layout` | `"row"` | minipages / tabular / custom | custom | Low | later |

## Tables and Figures

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Figure alignment | `figure.textAlign` | `"center"` | `\centering` in figure env | core | Low | later |
| Caption position | `caption.position` | `"bottom"` | caption placement in environment | core / `caption` | Low | later |
| Caption font size | `caption.fontSize` | `"small"` | caption style config | `caption` | Low | later |
| Table rule style | `table.rules` | `"booktabs"` | `\toprule`, `\midrule`, `\bottomrule` | `booktabs` | Low | later |
| Float placement | `floatPlacement` | `"htbp"` | env placement options | core | Low | later |

## Boxes, Callouts, and Framed Regions

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Callout box | `variant` | `"callout"` | themed box environment | `tcolorbox`, `mdframed` | Medium | v1 |
| Box title | `title` | `"Note"` | boxed env title field | `tcolorbox` | Low | later |
| Box shadow feel | `elevation` | `"low"` | approximate via frames/colors | custom / `tcolorbox` | Low | later |
| Rounded corners | `borderRadius` | `"2mm"` | rounded frame config | `tcolorbox` | Low | later |

## Color System

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Named color | `color` | `"blue"` | use named color | `xcolor` | Medium | v1 |
| Hex color | `color` | `"#336699"` | define color then apply | `xcolor` | Low | later |
| RGB color | `color` | `"rgb(51,102,153)"` | define color then apply | `xcolor` | Low | later |
| Opacity | `opacity` | `0.5` | limited support depending on element | `xcolor`, `tikz` | Low | later |
| Theme palette token | `themeColor` | `"primary"` | compiler-defined color map | custom compiler layer | Medium | v1 |

## Page Breaking and Flow Control

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| Force page break | `pageBreakBefore` | `"always"` | `\newpage` or `\clearpage` | core | Medium | v1 |
| Avoid page break | `breakInside` | `"avoid"` | boxed content / penalties / needspace | `needspace`, custom | Low | later |
| Keep heading with next block | `keepWithNext` | `true` | `needspace` / custom penalty logic | `needspace`, custom | Low | later |
| Clear floats before section | `clearFloats` | `true` | `\clearpage` / `\FloatBarrier` | core / `placeins` | Low | later |

## PDF Metadata and Output

| Concept | Public API name | Example value | Typical LaTeX implementation | Package / mechanism | Priority | Scope |
|---|---|---:|---|---|---:|---|
| PDF title | `pdf.title` | `"My Document"` | `\hypersetup{pdftitle=...}` | `hyperref` | Low | later |
| PDF author | `pdf.author` | `"Tauraj Greig"` | `\hypersetup{pdfauthor=...}` | `hyperref` | Low | later |
| PDF subject | `pdf.subject` | `"Thesis"` | `\hypersetup{pdfsubject=...}` | `hyperref` | Low | later |
| PDF keywords | `pdf.keywords` | `"react,latex"` | `\hypersetup{pdfkeywords=...}` | `hyperref` | Low | later |
| Hyperlink color mode | `links.color` | `"blue"` | `\hypersetup{colorlinks=true,...}` | `hyperref` | Low | later |

## Likely `v0` Style Surface

This is the smallest style surface that looks worth implementing first.

| Public API name | Why it matters |
|---|---|
| `size` | Required to define the page |
| `margin` | Required for document layout |
| `marginTop` / `marginRight` / `marginBottom` / `marginLeft` | Useful even in early page design |
| `fontFamily` | Basic template identity |
| `fontSize` | Basic readability and template control |
| `lineHeight` | Important for document feel |
| `textAlign` | Needed for title blocks and boxes |
| `gap` | Simple and useful stack spacing primitive |

## Candidate `v1` Additions

These feel like the next most useful style features after the pipeline works.

| Public API name | Why it matters |
|---|---|
| `paragraphSpacing` | Common document-level styling need |
| `textIndent` | Common academic and literary formatting control |
| `padding` | Makes box-style templates practical |
| `borderBottom` / `border` | Enables more expressive template design |
| `columns` | Important for some article layouts |
| `pageBreakBefore` / `pageBreakAfter` | Needed for serious long-form layout |
| `themeColor` / `color` | Supports stronger template identity |
| `section.*` style keys | Important once headings become first-class |

## Mapping Guidance

When deciding whether to expose a style concept in ReactDoc:

1. Can it be expressed consistently in LaTeX?
2. Can it be expressed consistently in HTML/CSS?
3. Is the React-facing name intuitive?
4. Does it belong to page layout, typography, spacing, or semantic styling?
5. Can the compiler own the weird backend details so template authors do not have to?

If the answer to `1` is weak, that style feature should probably stay out of the early public API.
