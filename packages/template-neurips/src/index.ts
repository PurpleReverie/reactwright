// NeurIPS 2025 conference-paper helper package. Bundles the Template
// that implements the canonical single-column NeurIPS layout plus typed
// content helpers (authorMetas / AuthorCard for the multi-author block,
// NeurIPSChecklist for the required Paper Checklist).
export { Template, NEURIPS_STYLES, NEURIPS_CSS, type TemplateProps } from "./template.js";
export { AuthorCard, authorMetas, type NeurIPSAuthor } from "./author.js";
export {
  NeurIPSChecklist,
  CHECKLIST_QUESTIONS,
  type ChecklistQuestion,
  type ChecklistAnswer,
  type NeurIPSChecklistProps
} from "./checklist.js";
