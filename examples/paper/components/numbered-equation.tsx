import "reactwright/jsx";
import React from "react";

// Thin wrapper around the engine's <math> block that pre-fills the
// role+id pair an IEEE numbered equation always needs. With the
// numberedEquation role rule defined in @reactwright/template-ieee,
// this auto-numbers as (1), (2), … and lets <ref> resolve to "(N)".
//
//   <NumberedEquation id="eq-shannon" tex="C = W \log_2(1 + S/N)" />
//   …as shown in <ref to="eq-shannon" />…
export function NumberedEquation({
  id,
  tex
}: {
  id: string;
  tex: string;
}): React.ReactElement {
  return <math id={id} role="numbered" src={tex} />;
}
