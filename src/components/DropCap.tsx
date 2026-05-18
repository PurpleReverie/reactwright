import type { ReactNode } from "react";

export type DropCapProps = {
  children?: ReactNode;
};

/**
 * Wraps a paragraph that should receive a drop-cap treatment on its
 * first letter. Templates apply `:first-letter` styling to paragraphs
 * with the `drop-cap` role.
 */
export function DropCap({ children }: DropCapProps) {
  return <p role="drop-cap">{children}</p>;
}
