import type { ReactNode } from "react";

export function Dialogue({
  speaker,
  direction,
  children
}: {
  speaker: string;
  direction?: string;
  children: ReactNode;
}) {
  return (
    <quote role="dialogue" speaker={speaker}>
      <p>
        <font family="Courier Prime">
          <strong>{speaker}</strong>
        </font>
      </p>
      {direction != null ? (
        <p>
          <em>{direction}</em>
        </p>
      ) : null}
      <p>{children}</p>
    </quote>
  );
}
