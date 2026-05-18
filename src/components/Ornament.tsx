export type OrnamentProps = {
  kind?: "leaf" | "fleuron" | "rule" | "asterism";
};

/**
 * Centered decorative break. Renders as a paragraph with the `ornament`
 * role; templates can replace the textual fallback with an SVG via a
 * variant treatment.
 */
export function Ornament({ kind = "asterism" }: OrnamentProps) {
  const fallback = kind === "asterism" ? "* * *" : kind === "rule" ? "—" : "❦";
  return (
    <p role="ornament" variant={`ornament-${kind}`}>
      {fallback}
    </p>
  );
}
