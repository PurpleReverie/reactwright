import type { TemplateProps } from "../prop-readers.js";
import type { SlotName, SlotNode } from "../ir.js";

// Slot names are open strings. The canonical names (title, author,
// abstract, body) are populated from DocumentNode + the body stream;
// any other name is populated from <meta name="X"> content entries.
// We only validate that the prop is a non-empty trimmed string —
// resolution-time lookup against an empty slot bucket is a no-op, not
// an error, so authoring a slot before any content provides it is OK.
function validateSlotName(name: unknown): SlotName {
  if (typeof name !== "string") {
    throw new Error(`\`slot\` \`name\` must be a string (got ${typeof name}).`);
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new Error("`slot` `name` must be a non-empty string.");
  }
  return trimmed;
}

export function slotNode(props: TemplateProps): SlotNode {
  return {
    kind: "slot",
    name: validateSlotName(props.name)
  };
}
