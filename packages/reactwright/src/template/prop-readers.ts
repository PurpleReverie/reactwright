import type {
  FixedAnchor,
  FixedWhen,
  LayerWhen,
  MarginAnchor,
  MarginMatterWhen,
  RegionPositioning,
  TemplateBoxProps,
  TemplateBreaksProps,
  TemplateLayoutProps,
  TemplatePageProps,
  TemplateParagraphProps,
  TemplateStyle,
  TemplateTypographyProps
} from "./ir.js";

// Template-specific prop readers. The shared/prop-readers.ts helpers
// cover primitive shapes; this module adds the template-domain readers
// (style groups, margin anchors, when-policies, region positioning,
// fixed-anchor coordinates).

// Loose shape of the props the reconciler hands the template
// factories. Field accesses are type-checked at read time, so the
// optional-field declarations here are descriptive rather than
// enforced.
export type TemplateProps = Record<string, unknown> & {
  style?: TemplateStyle;
  page?: TemplatePageProps;
  typography?: TemplateTypographyProps;
  paragraph?: TemplateParagraphProps;
  box?: TemplateBoxProps;
  layout?: TemplateLayoutProps;
  breaks?: TemplateBreaksProps;
  gap?: string;
  name?: string;
  match?: string;
  apply?: string;
  on?: string;
  use?: string;
  anchor?: unknown;
  when?: unknown;
  fill?: boolean;
  cover?: boolean;
  contain?: boolean;
  center?: boolean;
  policy?: unknown;
};

// Read one of the typed-prop groups (page, typography, paragraph, box,
// layout, breaks). Each group is a bag of style declarations that
// merge into a single TemplateStyle.
export function readOptionalObjectProp<T extends Record<string, unknown>>(
  props: TemplateProps,
  key: "page" | "typography" | "paragraph" | "box" | "layout" | "breaks"
): T | undefined {
  const value = props[key];
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`\`${key}\` must be an object when provided.`);
  }
  return value as T;
}

// Merge the typed-prop groups + the raw `style` escape hatch into one
// TemplateStyle. Later groups override earlier ones; raw `style` wins.
export function mergeTemplateStyleGroups(props: TemplateProps): TemplateStyle | undefined {
  const page = readOptionalObjectProp<TemplatePageProps>(props, "page");
  const typography = readOptionalObjectProp<TemplateTypographyProps>(props, "typography");
  const paragraph = readOptionalObjectProp<TemplateParagraphProps>(props, "paragraph");
  const box = readOptionalObjectProp<TemplateBoxProps>(props, "box");
  const layout = readOptionalObjectProp<TemplateLayoutProps>(props, "layout");
  const breaks = readOptionalObjectProp<TemplateBreaksProps>(props, "breaks");

  const merged: TemplateStyle = {
    ...(page ?? {}),
    ...(typography ?? {}),
    ...(paragraph ?? {}),
    ...(box ?? {}),
    ...(layout ?? {}),
    ...(breaks ?? {}),
    ...(props.style ?? {})
  };

  return Object.keys(merged).length > 0 ? merged : undefined;
}

// Required template-side identifier (page-set name, rule match, etc.).
// Throws if missing or empty after trim.
export function readRequiredTemplateToken(
  props: TemplateProps,
  key: "name" | "match" | "apply" | "on" | "use"
): string {
  const value = props[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${key}\` must be a non-empty string.`);
  }
  return value.trim();
}

// Optional template-side token (currently `gap` and `on`). Returns
// undefined if absent; throws if present-but-empty (consistent with
// content's getNonEmptyStringIfPresent semantics).
export function readOptionalTemplateToken(
  props: TemplateProps,
  key: "gap" | "on"
): string | undefined {
  const value = props[key];
  if (value == null) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${key}\` must be a non-empty string when provided.`);
  }
  return value.trim();
}

// Optional className prop. Returns undefined when absent, the trimmed
// string when present, throws on present-but-empty.
export function readClassName(props: TemplateProps): string | undefined {
  const value = (props as Record<string, unknown>).className;
  if (value == null) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("`className` must be a non-empty string when provided.");
  }
  return value.trim();
}

// Fixed-position anchor: either a named anchor ("top-left") or a
// coordinate object ({ top: "20mm", right: "10mm" }).
export function readFixedAnchor(props: TemplateProps): FixedAnchor {
  const anchor = props.anchor;
  if (typeof anchor === "string" && anchor.trim().length > 0) {
    return anchor.trim();
  }
  if (anchor != null && typeof anchor === "object" && !Array.isArray(anchor)) {
    const coord = anchor as Record<string, unknown>;
    const result: { [k: string]: string } = {};
    for (const key of ["top", "right", "bottom", "left", "inside", "outside"] as const) {
      const value = coord[key];
      if (typeof value === "string" && value.trim().length > 0) {
        result[key] = value.trim();
      }
    }
    if (Object.keys(result).length > 0) return result;
  }
  throw new Error("`fixed` requires a named or coordinate `anchor`.");
}

type AnchorCoord = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  inside?: string;
  outside?: string;
};

// Page-set anchors map: { fancyTop: { top: "20mm" }, ... } — declared
// on a <page-set> and referenced by name from <fixed anchor="...">.
export function readAnchorsMap(props: TemplateProps): Record<string, AnchorCoord> | undefined {
  const raw = (props as Record<string, unknown>).anchors;
  if (raw == null) return undefined;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("`anchors` must be an object map of name -> coordinate.");
  }
  const result: Record<string, AnchorCoord> = {};
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value == null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Anchor \`${name}\` must be a coordinate object.`);
    }
    const coord = value as Record<string, unknown>;
    const entry: Record<string, string> = {};
    for (const key of ["top", "right", "bottom", "left", "inside", "outside"]) {
      const v = coord[key];
      if (typeof v === "string" && v.trim().length > 0) {
        entry[key] = v.trim();
      }
    }
    result[name] = entry;
  }
  return result;
}

// Margin-box anchor for <header>/<footer>. CSS Paged Media defines a
// fixed set of margin-box positions; we accept that set verbatim plus
// the two-sided variants (inside/outside).
const MARGIN_ANCHORS: readonly MarginAnchor[] = [
  "top-left", "top-center", "top-right",
  "bottom-left", "bottom-center", "bottom-right",
  "top-inside", "top-outside",
  "bottom-inside", "bottom-outside",
  "left-top", "left-middle", "left-bottom",
  "right-top", "right-middle", "right-bottom"
];

export function readMarginAnchor(props: TemplateProps, kind: "header" | "footer"): MarginAnchor {
  if (MARGIN_ANCHORS.includes(props.anchor as MarginAnchor)) {
    return props.anchor as MarginAnchor;
  }
  throw new Error(`\`${kind}\` requires a valid \`anchor\` (e.g. top-left, bottom-center, top-outside).`);
}

// `when` policy for margin matter (header/footer): controls whether
// the box appears on the first page, every page except the first, or
// always.
const MARGIN_MATTER_WHEN_VALUES = [
  "all",
  "first-page",
  "not-first-page",
  "left",
  "right",
  "blank",
  "not-blank"
] as const;

export function readMarginMatterWhen(
  props: TemplateProps,
  kind: "header" | "footer"
): MarginMatterWhen | undefined {
  if (props.when == null) return undefined;
  if ((MARGIN_MATTER_WHEN_VALUES as readonly string[]).includes(props.when as string)) {
    return props.when as MarginMatterWhen;
  }
  throw new Error(
    `\`${kind}\` \`when\` must be one of ${MARGIN_MATTER_WHEN_VALUES.map((v) => `\`${v}\``).join(", ")}.`
  );
}

export function readLayerWhen(props: TemplateProps): LayerWhen | undefined {
  if (props.when == null) return undefined;
  if (props.when === "all" || props.when === "first-page" || props.when === "not-first-page") {
    return props.when;
  }
  throw new Error("`layer` `when` must be `all`, `first-page`, or `not-first-page`.");
}

export function readFixedWhen(props: TemplateProps): FixedWhen | undefined {
  if (props.when == null) return undefined;
  if (props.when === "all" || props.when === "first-page" || props.when === "not-first-page") {
    return props.when;
  }
  throw new Error("`fixed` `when` must be `all`, `first-page`, or `not-first-page`.");
}

// Region positioning flags — fill, cover, contain, center.
export function readRegionPositioning(props: TemplateProps): RegionPositioning | undefined {
  const positioning: RegionPositioning = {};
  if (props.fill === true) positioning.fill = true;
  if (props.cover === true) positioning.cover = true;
  if (props.contain === true) positioning.contain = true;
  if (props.center === true) positioning.center = true;
  return Object.keys(positioning).length > 0 ? positioning : undefined;
}

// `<page match=... use=...>` is the page-rule form of <page>; without
// those props it's the page-container form.
export function isPageRule(props: TemplateProps): boolean {
  return typeof props.match === "string" || typeof props.use === "string";
}
