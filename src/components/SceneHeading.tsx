import type { ReactNode } from "react";

export type SceneHeadingProps = {
  title: string;
  children?: ReactNode;
};

/**
 * Shorthand for a screenplay-style scene heading section.
 * Templates apply the `scene-heading` role to render the title in
 * uppercase / bold / monospace etc.
 */
export function SceneHeading({ title, children }: SceneHeadingProps) {
  return (
    <section title={title} role="scene-heading">
      {children}
    </section>
  );
}
