// Formal business-letter helper package. Bundles a Template that
// styles the conventional regions of a formal letter (letterhead,
// date, addressee, subject, salutation, body, closing, signature)
// via section-role rules. Authors tag each region with `role` and
// the template's rules pick it up — no need for engine-specific
// markup.
export { Template, LETTER_STYLES, LETTER_CSS } from "./template.js";
