import type { ReactNode } from "react";

export type DialogueProps = {
  speaker?: string;
  children?: ReactNode;
};

/**
 * Screenplay-style dialogue line. Wraps the content as a paragraph
 * with role="dialogue" and an optional speaker prefix.
 */
export function Dialogue({ speaker, children }: DialogueProps) {
  return (
    <p role="dialogue">
      {speaker != null ? (
        <strong>{speaker}: </strong>
      ) : null}
      {children}
    </p>
  );
}
