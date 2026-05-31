// Long-form book helper package. Bundles a Template configured for
// trade-paperback dimensions (5.5" × 8.5"), chapter-based flow with
// per-chapter running headers (chapter title on odd pages, book title
// on even pages), and a serif body face suitable for sustained
// reading. Front-matter and back-matter sections share the same
// regime; differentiate via section role rules at the author level.
export { Template, BOOK_STYLES, BOOK_CSS } from "./template.js";
