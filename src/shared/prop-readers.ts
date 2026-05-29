// Typed reader helpers for the raw `props` objects the React reconciler
// hands to `createInstance`. The reconciler's prop type is effectively
// `Record<string, unknown>`, so every field access in the node factories
// needs a type check. These helpers centralise that pattern.
//
// Used by content and template node factories (phases 2 and 3 of the
// refactor plan). Each reader throws on the wrong shape with a
// consistent message so factory errors read uniformly.

type RawProps = Record<string, unknown>;

function asProps(props: object): RawProps {
  return props as RawProps;
}

// Optional string. Returns undefined if absent; throws if present but
// not a string.
export function getString(props: object, key: string): string | undefined {
  const value = asProps(props)[key];
  if (value == null) return undefined;
  if (typeof value !== "string") {
    throw new Error(`\`${key}\` must be a string when provided.`);
  }
  return value;
}

// Optional string, trimmed. Returns undefined if absent or if the
// string is empty after trimming; throws if present but not a string.
// Use for permissive fields (e.g. `language`, `caption`) where an
// empty value is equivalent to absence.
export function getTrimmedString(props: object, key: string): string | undefined {
  const value = getString(props, key);
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// Strict optional string. Returns undefined if absent; throws if
// present but empty (after trimming) or not a string. Use for fields
// whose presence implies a non-empty value (e.g. `id`, `role`, `page`,
// `variant`, `speaker` — if the author wrote it, they meant it).
export function getNonEmptyStringIfPresent(props: object, key: string): string | undefined {
  const value = asProps(props)[key];
  if (value == null) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${key}\` must be a non-empty string when provided.`);
  }
  return value.trim();
}

// Required non-empty string. The `intrinsic` argument is the JSX tag
// name and appears in the error message for diagnostics.
export function getRequiredString(props: object, key: string, intrinsic: string): string {
  const value = asProps(props)[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`\`${intrinsic}\` requires a non-empty \`${key}\`.`);
  }
  return value.trim();
}

// Optional number. Returns undefined if absent; throws if present but
// not a number.
export function getNumber(props: object, key: string): number | undefined {
  const value = asProps(props)[key];
  if (value == null) return undefined;
  if (typeof value !== "number") {
    throw new Error(`\`${key}\` must be a number when provided.`);
  }
  return value;
}

// Optional boolean. Strict — only true/false count. Anything else
// returns undefined so the caller can decide whether absence is fine.
export function getBoolean(props: object, key: string): boolean | undefined {
  const value = asProps(props)[key];
  if (value === true) return true;
  if (value === false) return false;
  return undefined;
}

// Optional object. Throws on arrays or non-objects. The caller is
// responsible for narrowing the returned `T`.
export function getObject<T extends object>(props: object, key: string): T | undefined {
  const value = asProps(props)[key];
  if (value == null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`\`${key}\` must be an object when provided.`);
  }
  return value as T;
}

// Optional one-of literal. Returns undefined if absent; throws if
// present and not in `allowed`. Useful for enum-shaped props like
// `when="first-page"` or `side="outside"`.
export function getEnum<T extends string>(
  props: object,
  key: string,
  allowed: readonly T[]
): T | undefined {
  const value = asProps(props)[key];
  if (value == null) return undefined;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new Error(`\`${key}\` must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}
