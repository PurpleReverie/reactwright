import type { TemplateProps } from "../prop-readers.js";
import type { SlotName, SlotNode } from "../ir.js";

// Slots are typed: only the four canonical names are accepted.
function validateSlotName(name: unknown): SlotName {
  if (name === "title" || name === "author" || name === "abstract" || name === "body") {
    return name;
  }
  throw new Error(`Unsupported template slot: ${String(name)}`);
}

export function slotNode(props: TemplateProps): SlotNode {
  return {
    kind: "slot",
    name: validateSlotName(props.name)
  };
}
