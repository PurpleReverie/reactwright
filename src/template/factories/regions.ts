import {
  mergeTemplateStyleGroups,
  readFixedAnchor,
  readFixedWhen,
  readLayerWhen,
  readOptionalTemplateToken,
  readRegionPositioning,
  type TemplateProps
} from "../prop-readers.js";
import type {
  ColumnNode,
  ColumnsNode,
  FixedNode,
  LayerNode,
  RegionNode,
  StackNode
} from "../ir.js";

export function regionNode(props: TemplateProps): RegionNode {
  const positioning = readRegionPositioning(props);
  return {
    kind: "region",
    style: mergeTemplateStyleGroups(props),
    ...(positioning != null ? { positioning } : {}),
    children: []
  };
}

export function layerNode(props: TemplateProps): LayerNode {
  const name =
    typeof props.name === "string" && props.name.trim().length > 0 ? props.name.trim() : undefined;
  return {
    kind: "layer",
    ...(name != null ? { name } : {}),
    when: readLayerWhen(props),
    style: mergeTemplateStyleGroups(props),
    children: []
  };
}

export function stackNode(props: TemplateProps): StackNode {
  const style = mergeTemplateStyleGroups(props);
  // `gap` can come from the prop or from a stack's style group; the
  // prop wins, but we fall back to style.gap so authors can set both
  // in one place.
  const inferredGap = typeof style?.gap === "string" ? style.gap : undefined;
  const gap = readOptionalTemplateToken(props, "gap") ?? inferredGap;
  return {
    kind: "stack",
    gap,
    style,
    children: []
  };
}

export function columnsNode(props: TemplateProps): ColumnsNode {
  const gap = readOptionalTemplateToken(props, "gap");
  const widthsRaw = (props as Record<string, unknown>).widths;
  let widths: string[] | undefined;
  if (Array.isArray(widthsRaw)) {
    widths = widthsRaw.filter((w): w is string => typeof w === "string" && w.length > 0);
    if (widths.length === 0) widths = undefined;
  }
  return {
    kind: "columns",
    ...(gap != null ? { gap } : {}),
    ...(widths != null ? { widths } : {}),
    style: mergeTemplateStyleGroups(props),
    children: []
  };
}

export function columnNode(props: TemplateProps): ColumnNode {
  const widthRaw = (props as Record<string, unknown>).width;
  const width = typeof widthRaw === "string" ? widthRaw : undefined;
  return {
    kind: "column",
    ...(width != null ? { width } : {}),
    style: mergeTemplateStyleGroups(props),
    children: []
  };
}

export function fixedNode(props: TemplateProps): FixedNode {
  return {
    kind: "fixed",
    anchor: readFixedAnchor(props),
    when: readFixedWhen(props),
    style: mergeTemplateStyleGroups(props),
    children: []
  };
}
