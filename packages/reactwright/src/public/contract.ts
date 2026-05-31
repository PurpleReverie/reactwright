import type { ReactNode } from "react";

/**
 * defineRoles freezes a list of role names with their literal types so
 * Role<typeof MY_ROLES> gives a string-literal union for writers/designers.
 *
 * Example:
 *   export const BookRoles = defineRoles(["opener", "epigraph", "scene-heading"]);
 *   type BookRole = Role<typeof BookRoles>;
 */
export function defineRoles<const T extends readonly string[]>(roles: T): T {
  return roles;
}

export type Role<T extends readonly string[]> = T[number];

export type RolePropFor<T extends readonly string[]> = {
  role?: Role<T>;
};

/**
 * Template<TRoles> is a branded type for templates that declare the role
 * vocabulary they accept. Content authors importing a template can use
 * `Role<typeof TEMPLATE.roles>` to discover what role strings are valid.
 */
export interface Template<TRoles extends readonly string[] = readonly string[]> {
  (props: { children?: ReactNode }): ReactNode;
  readonly roles: TRoles;
}

export function defineTemplate<TRoles extends readonly string[]>(
  fn: (props: { children?: ReactNode }) => ReactNode,
  roles: TRoles
): Template<TRoles> {
  const t = fn as Template<TRoles>;
  Object.defineProperty(t, "roles", { value: roles, enumerable: false });
  return t;
}
