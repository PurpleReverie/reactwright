// Public library entry. Converts a Markdown source string (with
// optional YAML frontmatter) into a Reactwright content JSX tree.
//
// Usage:
//   import { markdownToReactwright } from "@reactwright/markdown";
//   const { document, frontmatter } = markdownToReactwright(mdSource);
//
// `document` is a React element wrapping the engine's <document>
// intrinsic. Feed it to renderContentToIR() or compose it under a
// Template via the CLI.

import "reactwright/jsx";
import type { ReactElement } from "react";
import matter from "gray-matter";

import { parseMarkdownToDocument } from "./parse.js";

export type MarkdownReference = {
  key: string;
  text: string;
};

export type MarkdownFrontmatter = {
  title?: string;
  author?: string;
  template?: string;
  references?: MarkdownReference[];
  [extra: string]: unknown;
};

export type MarkdownToReactwrightResult = {
  document: ReactElement;
  frontmatter: MarkdownFrontmatter;
};

export function markdownToReactwright(source: string): MarkdownToReactwrightResult {
  const parsed = matter(source);
  const frontmatter = (parsed.data ?? {}) as MarkdownFrontmatter;
  const document = parseMarkdownToDocument(parsed.content, frontmatter);
  return { document, frontmatter };
}
