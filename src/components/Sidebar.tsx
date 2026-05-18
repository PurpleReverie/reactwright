import type { ReactNode } from "react";

export type SidebarProps = {
  title?: string;
  children?: ReactNode;
};

/**
 * Marginalia / pull-quote wrapper. Renders as a quote with the
 * `sidebar` role so templates can apply float or column positioning.
 */
export function Sidebar({ title, children }: SidebarProps) {
  return (
    <quote role="sidebar">
      {title != null ? <p role="sidebar-title"><strong>{title}</strong></p> : null}
      {children}
    </quote>
  );
}
