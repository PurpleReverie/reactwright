import "reactwright/jsx";

import { defineRoles, type Role } from "reactwright/contract";

export const BookRoles = defineRoles(["opener", "epigraph", "scene-heading", "callout"] as const);
export type BookRole = Role<typeof BookRoles>;

// Compile-time check: literal narrowing works.
const r1: BookRole = "opener";
const r2: BookRole = "scene-heading";

// Use BookRole as a typed wrapper for a content component:
export type ChapterProps = {
  role?: BookRole;
  children?: React.ReactNode;
};

export function Chapter({ role, children }: ChapterProps) {
  return <section title="Chapter" role={role}>{children}</section>;
}

export const ExampleUsage = (
  <Chapter role="scene-heading">
    <p>Hi.</p>
  </Chapter>
);

void r1;
void r2;
