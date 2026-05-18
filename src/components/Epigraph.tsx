import type { ReactNode } from "react";

export type EpigraphProps = {
  attribution?: string;
  children?: ReactNode;
};

/**
 * Attributed epigraph that appears before a section or chapter. The
 * attribution becomes a trailing paragraph with the `epigraph-attribution`
 * role so templates can style it differently from the body.
 */
export function Epigraph({ attribution, children }: EpigraphProps) {
  return (
    <quote role="epigraph">
      {children}
      {attribution != null ? <p role="epigraph-attribution">— {attribution}</p> : null}
    </quote>
  );
}
