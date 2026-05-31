import {
  getBoolean,
  getEnum,
  getNonEmptyStringIfPresent,
  getNumber,
  getString,
  getTrimmedString
} from "../shared/prop-readers.js";

import type {
  CaptionNode,
  CellNode,
  CodeBlockNode,
  FigureNode,
  LinkNode,
  PageBreakNode,
  RowNode,
  SemanticNode,
  SetRunningNode,
  TableNode
} from "./ir.js";

// Raw props as delivered by the React reconciler. Field accesses go
// through shared/prop-readers.ts; this type is just the loose shape
// the reconciler hands us.
export type ContentProps = Record<string, unknown>;

// One small factory per content intrinsic. Each reads its specific
// props, validates them, and returns the IR node.

function readMetadata(props: ContentProps): {
  id?: string;
  role?: string;
  page?: string;
  variant?: string;
  className?: string;
} {
  const id = getNonEmptyStringIfPresent(props, "id");
  const role = getNonEmptyStringIfPresent(props, "role");
  const page = getNonEmptyStringIfPresent(props, "page");
  const variant = getNonEmptyStringIfPresent(props, "variant");
  const className = getNonEmptyStringIfPresent(props, "className");
  return {
    ...(id != null ? { id } : {}),
    ...(role != null ? { role } : {}),
    ...(page != null ? { page } : {}),
    ...(variant != null ? { variant } : {}),
    ...(className != null ? { className } : {})
  };
}

function readClassName(props: ContentProps): { className?: string } {
  const className = getNonEmptyStringIfPresent(props, "className");
  return className != null ? { className } : {};
}

function documentNode(props: ContentProps): SemanticNode {
  return {
    kind: "document",
    title: String(props.title ?? ""),
    ...(typeof props.author === "string" ? { author: props.author } : {}),
    children: []
  };
}

function sectionNode(props: ContentProps): SemanticNode {
  const counter = getNonEmptyStringIfPresent(props, "counter");
  return {
    kind: "section",
    title: String(props.title ?? ""),
    ...readMetadata(props),
    ...(counter != null ? { counter } : {}),
    children: []
  };
}

function headingNode(props: ContentProps): SemanticNode {
  const level = getNumber(props, "level") ?? 1;
  if (![1, 2, 3, 4, 5, 6].includes(level)) {
    throw new Error("`heading` `level` must be 1-6.");
  }
  const title = getString(props, "title");
  if (title == null || title.length === 0) {
    throw new Error("`heading` requires a non-empty `title`.");
  }
  return {
    kind: "heading",
    level: level as 1 | 2 | 3 | 4 | 5 | 6,
    title,
    ...readMetadata(props)
  };
}

function paragraphNode(props: ContentProps): SemanticNode {
  return {
    kind: "paragraph",
    ...readMetadata(props),
    children: []
  };
}

function figureNode(props: ContentProps): SemanticNode {
  return {
    kind: "figure",
    ...readMetadata(props),
    src: String(props.src ?? ""),
    alt: getString(props, "alt"),
    caption: getString(props, "caption"),
    width: getString(props, "width")
  } as FigureNode;
}

function tableNode(props: ContentProps): SemanticNode {
  const id = getNonEmptyStringIfPresent(props, "id");
  return {
    kind: "table",
    ...(id != null ? { id } : {}),
    ...readClassName(props),
    caption: getString(props, "caption"),
    children: []
  } satisfies TableNode;
}

function rowNode(props: ContentProps): SemanticNode {
  return { kind: "row", ...readClassName(props), children: [] } satisfies RowNode;
}

function cellNode(props: ContentProps): SemanticNode {
  return {
    kind: "cell",
    header: getBoolean(props, "header") === true ? true : undefined,
    ...readClassName(props),
    children: []
  } satisfies CellNode;
}

function captionNode(props: ContentProps): SemanticNode {
  const id = getNonEmptyStringIfPresent(props, "id");
  const role = getNonEmptyStringIfPresent(props, "role");
  return {
    kind: "caption",
    ...(id != null ? { id } : {}),
    ...(role != null ? { role } : {}),
    ...readClassName(props),
    children: []
  } satisfies CaptionNode;
}

function quoteNode(props: ContentProps): SemanticNode {
  const speaker = getNonEmptyStringIfPresent(props, "speaker");
  return {
    kind: "blockquote",
    ...readMetadata(props),
    ...(speaker != null ? { speaker } : {}),
    children: []
  };
}

function codeBlockNode(props: ContentProps): SemanticNode {
  const id = getNonEmptyStringIfPresent(props, "id");
  return {
    kind: "code-block",
    ...(id != null ? { id } : {}),
    ...(getTrimmedString(props, "language") != null ? { language: getTrimmedString(props, "language")! } : {}),
    children: []
  } satisfies CodeBlockNode;
}

function preNode(props: ContentProps): SemanticNode {
  const id = getNonEmptyStringIfPresent(props, "id");
  return {
    kind: "pre",
    ...(id != null ? { id } : {}),
    children: []
  };
}

function listNode(props: ContentProps): SemanticNode {
  return {
    kind: "list",
    ...readMetadata(props),
    ordered: getBoolean(props, "ordered") === true,
    children: []
  };
}

function itemNode(props: ContentProps): SemanticNode {
  const id = getNonEmptyStringIfPresent(props, "id");
  return {
    kind: "item",
    ...(id != null ? { id } : {}),
    children: []
  };
}

function defsNode(props: ContentProps): SemanticNode {
  return {
    kind: "defs",
    ...readMetadata(props),
    children: []
  };
}

function defNode(props: ContentProps): SemanticNode {
  const term = getTrimmedString(props, "term");
  if (term == null) {
    throw new Error("`def` requires a non-empty `term`.");
  }
  return { kind: "def", term, children: [] };
}

function emNode(props: ContentProps): SemanticNode {
  return { kind: "em", ...readClassName(props), children: [] };
}

function strongNode(props: ContentProps): SemanticNode {
  return { kind: "strong", ...readClassName(props), children: [] };
}

function codeNode(props: ContentProps): SemanticNode {
  return { kind: "code", ...readClassName(props), children: [] };
}

function brNode(_props: ContentProps): SemanticNode {
  return { kind: "br" };
}

function footnoteNode(props: ContentProps): SemanticNode {
  const marker = getString(props, "marker");
  return {
    kind: "footnote",
    ...(marker != null ? { marker } : {}),
    ...readClassName(props),
    children: []
  };
}

function sidenoteNode(props: ContentProps): SemanticNode {
  return { kind: "sidenote", ...readClassName(props), children: [] };
}

function refsNode(props: ContentProps): SemanticNode {
  return { kind: "refs", ...readClassName(props), children: [] };
}

function refEntryNode(props: ContentProps): SemanticNode {
  // Accept either `refKey` (canonical) or `key` (shorthand). React
  // strips the `key` prop before it reaches reconciler instance
  // creation, so we read it via the same getter as any other prop.
  const refKey = getTrimmedString(props, "refKey") ?? getTrimmedString(props, "key");
  if (refKey == null) {
    throw new Error("`ref-entry` requires a non-empty `refKey` (or `key`).");
  }
  return { kind: "ref-entry", refKey, ...readClassName(props), children: [] };
}

function refNode(props: ContentProps): SemanticNode {
  const to = getTrimmedString(props, "to");
  if (to == null) {
    throw new Error("`ref` requires a non-empty `to`.");
  }
  const show = getEnum(props, "show", ["number", "page", "title", "number-and-page"] as const);
  return { kind: "ref", to, ...(show != null ? { show } : {}), ...readClassName(props) };
}

function mathNode(props: ContentProps): SemanticNode {
  const src = getString(props, "src");
  if (src == null || src.length === 0) {
    throw new Error("`math` requires a non-empty `src` TeX string.");
  }
  return {
    kind: "math",
    src,
    ...readMetadata(props)
  };
}

function inlineMathNode(props: ContentProps): SemanticNode {
  const src = getString(props, "src");
  if (src == null || src.length === 0) {
    throw new Error("`m` requires a non-empty `src` TeX string.");
  }
  return { kind: "m", src };
}

function citeNode(props: ContentProps): SemanticNode {
  const key = getTrimmedString(props, "cite");
  if (key == null) {
    throw new Error("`cite` requires a non-empty `cite` key.");
  }
  return { kind: "cite", cite: key, ...readClassName(props) };
}

function indexNode(props: ContentProps): SemanticNode {
  const term = getTrimmedString(props, "term");
  if (term == null) {
    throw new Error("`index` requires a non-empty `term`.");
  }
  return { kind: "index", term, ...readClassName(props) };
}

function imgNode(props: ContentProps): SemanticNode {
  const src = getTrimmedString(props, "src");
  if (src == null) {
    throw new Error("`img` requires a non-empty `src`.");
  }
  return {
    kind: "img",
    src,
    ...(getString(props, "alt") != null ? { alt: getString(props, "alt")! } : {}),
    ...(getString(props, "width") != null ? { width: getString(props, "width")! } : {}),
    ...(getString(props, "height") != null ? { height: getString(props, "height")! } : {})
  };
}

function subNode(_props: ContentProps): SemanticNode {
  return { kind: "sub", children: [] };
}

function supNode(_props: ContentProps): SemanticNode {
  return { kind: "sup", children: [] };
}

function linkNode(props: ContentProps): SemanticNode {
  const href = getTrimmedString(props, "href");
  if (href == null) {
    throw new Error("`link` requires a non-empty `href`.");
  }
  const title = getTrimmedString(props, "titleText");
  return {
    kind: "link",
    href,
    ...(title != null ? { title } : {}),
    ...readClassName(props),
    children: []
  } satisfies LinkNode;
}

function pageBreakNode(_props: ContentProps): SemanticNode {
  return { kind: "page-break" } satisfies PageBreakNode;
}

function setNode(props: ContentProps): SemanticNode {
  const name = getTrimmedString(props, "running");
  if (name == null) {
    throw new Error("`set` requires a non-empty `running` name.");
  }
  const value = getString(props, "value") ?? "";
  return {
    kind: "set-running",
    name,
    value
  } satisfies SetRunningNode;
}

// Dispatch table — adding a content intrinsic means adding one entry
// here plus its factory function above.
const FACTORIES: Record<string, (props: ContentProps) => SemanticNode> = {
  document: documentNode,
  section: sectionNode,
  heading: headingNode,
  p: paragraphNode,
  figure: figureNode,
  caption: captionNode,
  table: tableNode,
  row: rowNode,
  cell: cellNode,
  quote: quoteNode,
  "code-block": codeBlockNode,
  pre: preNode,
  list: listNode,
  item: itemNode,
  defs: defsNode,
  def: defNode,
  em: emNode,
  strong: strongNode,
  code: codeNode,
  br: brNode,
  footnote: footnoteNode,
  sidenote: sidenoteNode,
  refs: refsNode,
  "ref-entry": refEntryNode,
  ref: refNode,
  math: mathNode,
  m: inlineMathNode,
  cite: citeNode,
  index: indexNode,
  img: imgNode,
  sub: subNode,
  sup: supNode,
  link: linkNode,
  "page-break": pageBreakNode,
  set: setNode
};

export function createContentNode(type: string, props: ContentProps): SemanticNode {
  const factory = FACTORIES[type];
  if (factory == null) {
    throw new Error(`Unsupported content intrinsic: ${type}`);
  }
  return factory(props);
}
