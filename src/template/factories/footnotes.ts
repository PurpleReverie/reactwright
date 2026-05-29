import { mergeTemplateStyleGroups, type TemplateProps } from "../prop-readers.js";
import type { FootnoteAreaNode, SidenoteAreaNode, SidenoteAreaSide } from "../ir.js";

export function footnoteAreaNode(props: TemplateProps): FootnoteAreaNode {
  // `separator` defaults to true; only `separator={false}` opts out.
  const separator = (props as Record<string, unknown>).separator;
  return {
    kind: "footnote-area",
    ...(separator === false ? {} : { separator: true }),
    style: mergeTemplateStyleGroups(props)
  };
}

export function sidenoteAreaNode(props: TemplateProps): SidenoteAreaNode {
  const sideRaw = (props as Record<string, unknown>).side;
  let side: SidenoteAreaSide | undefined;
  if (sideRaw != null) {
    if (sideRaw === "outside" || sideRaw === "inside" || sideRaw === "left" || sideRaw === "right") {
      side = sideRaw;
    } else {
      throw new Error("`sidenote-area` `side` must be `outside`, `inside`, `left`, or `right`.");
    }
  }
  const widthRaw = (props as Record<string, unknown>).width;
  const gapRaw = (props as Record<string, unknown>).gap;
  return {
    kind: "sidenote-area",
    ...(side != null ? { side } : {}),
    ...(typeof widthRaw === "string" ? { width: widthRaw } : {}),
    ...(typeof gapRaw === "string" ? { gap: gapRaw } : {}),
    style: mergeTemplateStyleGroups(props)
  };
}
