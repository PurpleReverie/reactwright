// Per-render-scope lookup for rule-applied classes.
//
// The resolver attaches `classBindings` to the ResolvedPageNode as an
// array of [node, classNames[]] tuples (identity-keyed map). At
// renderResolvedToHTML entry we lift this into a Map<unknown, string[]>
// stored in module-level state for the duration of one render call.
// Renderers consult it via classListFor(node) to assemble the final
// `class="..."` attribute.
//
// Module-level state is acceptable here because reactwright renders
// one document end-to-end per call (no concurrency in render). The
// shape mirrors the existing `renderScopeRegimeFlows` pattern in
// content.ts.

let renderScopeClassBindings: Map<unknown, readonly string[]> | undefined;

export function setRenderScopeClassBindings(
  bindings: ReadonlyArray<readonly [unknown, readonly string[]]> | undefined
): void {
  if (bindings == null || bindings.length === 0) {
    renderScopeClassBindings = undefined;
    return;
  }
  renderScopeClassBindings = new Map(bindings.map(([n, c]) => [n, c]));
}

// Return the combined class list for a resolved-IR node:
//   - node's own className prop (if any)
//   - all rule-applied classes from the apply pass
// Returns undefined when there are no classes (so callers can omit
// the attribute).
export function classListFor(node: unknown): string | undefined {
  const ownCls = typeof (node as { className?: unknown })?.className === "string"
    ? (node as { className: string }).className
    : undefined;
  const applied = renderScopeClassBindings?.get(node);
  if (ownCls == null && (applied == null || applied.length === 0)) return undefined;
  const parts: string[] = [];
  if (ownCls != null) parts.push(ownCls);
  if (applied != null) for (const c of applied) if (!parts.includes(c)) parts.push(c);
  return parts.join(" ");
}

// Build a `class="..."` attribute (with leading space). Returns empty
// string when there are no classes. Used by renderers to splice into
// HTML tags safely.
export function classAttr(node: unknown): string {
  const cls = classListFor(node);
  if (cls == null || cls.length === 0) return "";
  return ` class="${escapeAttr(cls)}"`;
}

// Build a `class="..."` attribute that includes the given fixed base
// class names plus any rule-applied / className-prop classes for the
// node. Used by renderers that already attach engine-internal classes
// (reactwright-math, reactwright-abstract, ...) and now also need to
// merge in template-author-supplied classes.
export function classAttrWithBase(node: unknown, ...base: string[]): string {
  const parts: string[] = base.filter((b) => b.length > 0);
  const cls = classListFor(node);
  if (cls != null) {
    for (const c of cls.split(/\s+/)) {
      if (c.length > 0 && !parts.includes(c)) parts.push(c);
    }
  }
  if (parts.length === 0) return "";
  return ` class="${escapeAttr(parts.join(" "))}"`;
}

// Tiny html-attribute escaper; mirrors escapeHtml's behavior but
// scoped to `class` values which are space-separated identifiers in
// practice (we still escape for safety).
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
