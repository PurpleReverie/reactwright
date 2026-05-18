import type { ReactNode } from "react";

export type CalloutProps = {
  tone?: "info" | "warn" | "note";
  title?: string;
  children?: ReactNode;
};

/**
 * Decorated callout box. Renders as a styled <quote> with a role rule
 * (`callout`) so the template's variant decides the actual visual treatment.
 *
 * Usage:
 *   <Callout tone="warn" title="Watch out">
 *     <p>Don't run this in production.</p>
 *   </Callout>
 */
export function Callout({ tone = "info", title, children }: CalloutProps) {
  return (
    <quote role="callout" variant={`callout-${tone}`}>
      {title != null ? <p role="callout-title">{title}</p> : null}
      {children}
    </quote>
  );
}
