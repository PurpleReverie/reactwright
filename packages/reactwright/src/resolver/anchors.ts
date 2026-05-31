// Resolve a `<fixed anchor=...>` value to either a named anchor
// string (HTML backend converts to top-left/etc.) or a coordinate
// object. Named anchors are looked up in the current page-set's
// anchors map first; unknown strings pass through so the backend can
// match against its built-in anchor table.

export type AnchorCoordinate = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
};

export type AnchorsContext = {
  currentAnchors?: Record<string, Record<string, string | undefined>>;
};

export function resolveFixedAnchor(
  anchor: unknown,
  ctx: AnchorsContext
): string | AnchorCoordinate {
  if (typeof anchor === "string") {
    const named = ctx.currentAnchors?.[anchor];
    if (named != null) return normalizeCoordinate(named);
    return anchor;
  }
  if (anchor != null && typeof anchor === "object" && !Array.isArray(anchor)) {
    return normalizeCoordinate(anchor as Record<string, string>);
  }
  return "top-left";
}

// Collapse inside/outside into left/right for one-sided positioning.
// The two-sided handling lives in CSS Paged Media @page :left/:right
// rules, emitted by the HTML backend's buildMarginMatterCss.
export function normalizeCoordinate(
  coord: Record<string, string | undefined>
): AnchorCoordinate {
  const result: AnchorCoordinate = {};
  if (coord.top != null) result.top = coord.top;
  if (coord.bottom != null) result.bottom = coord.bottom;
  if (coord.left != null) result.left = coord.left;
  if (coord.right != null) result.right = coord.right;
  if (coord.inside != null && result.left == null) result.left = coord.inside;
  if (coord.outside != null && result.right == null) result.right = coord.outside;
  return result;
}
