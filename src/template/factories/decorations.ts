import { mergeTemplateStyleGroups, type TemplateProps } from "../prop-readers.js";
import type {
  FontNode,
  ImageNode,
  PageCountNode,
  PageNumberNode,
  RunningNode,
  RunningPolicy
} from "../ir.js";

export function fontNode(props: TemplateProps): FontNode {
  const familyRaw = (props as Record<string, unknown>).family;
  const family = typeof familyRaw === "string" ? familyRaw.trim() : "";
  if (family.length === 0) {
    throw new Error("`font` requires a non-empty `family`.");
  }
  const srcRaw = (props as Record<string, unknown>).src;
  const src = typeof srcRaw === "string" ? srcRaw.trim() : "";
  if (src.length === 0) {
    throw new Error("`font` requires a non-empty `src`.");
  }
  const weightRaw = (props as Record<string, unknown>).weight;
  const weight = typeof weightRaw === "string" || typeof weightRaw === "number" ? String(weightRaw) : undefined;
  const fontStyleRaw = (props as Record<string, unknown>).fontStyle;
  const fontStyle = typeof fontStyleRaw === "string" ? fontStyleRaw : undefined;
  const formatRaw = (props as Record<string, unknown>).format;
  const format = typeof formatRaw === "string" ? formatRaw : undefined;
  return {
    kind: "font",
    family,
    src,
    ...(weight != null ? { weight } : {}),
    ...(fontStyle != null ? { fontStyle } : {}),
    ...(format != null ? { format } : {})
  };
}

export function imageNode(props: TemplateProps): ImageNode {
  const src = typeof props.src === "string" ? props.src.trim() : "";
  if (src.length === 0) {
    throw new Error("`image` requires a non-empty `src`.");
  }
  const alt =
    typeof (props as Record<string, unknown>).alt === "string"
      ? ((props as Record<string, unknown>).alt as string)
      : undefined;
  const width =
    typeof (props as Record<string, unknown>).width === "string"
      ? ((props as Record<string, unknown>).width as string)
      : undefined;
  return {
    kind: "image",
    src,
    ...(alt != null ? { alt } : {}),
    ...(props.fill === true ? { fill: true } : {}),
    ...(props.cover === true ? { cover: true } : {}),
    ...(props.contain === true ? { contain: true } : {}),
    ...(width != null ? { width } : {}),
    style: mergeTemplateStyleGroups(props)
  };
}

export function runningNode(props: TemplateProps): RunningNode {
  const name = typeof props.name === "string" ? props.name.trim() : "";
  if (name.length === 0) {
    throw new Error("`running` requires a non-empty `name`.");
  }
  let policy: RunningPolicy | undefined;
  if (props.policy != null) {
    if (
      props.policy === "start" ||
      props.policy === "first" ||
      props.policy === "last" ||
      props.policy === "first-except"
    ) {
      policy = props.policy;
    } else {
      throw new Error("`running` `policy` must be `start`, `first`, `last`, or `first-except`.");
    }
  }
  return {
    kind: "running",
    name,
    ...(policy != null ? { policy } : {}),
    style: mergeTemplateStyleGroups(props)
  };
}

export function pageNumberNode(props: TemplateProps): PageNumberNode {
  return {
    kind: "page-number",
    style: mergeTemplateStyleGroups(props)
  };
}

export function pageCountNode(props: TemplateProps): PageCountNode {
  return {
    kind: "page-count",
    style: mergeTemplateStyleGroups(props)
  };
}
