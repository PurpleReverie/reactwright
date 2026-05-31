// Resolves a template name to its React component. The CLI calls
// this with whatever the user passed via `--template=...` or the
// frontmatter `template` field; the default is "essay" so a bare
// .md file with no template hint still renders.
//
// Implemented as a dynamic import so the CLI doesn't need to require
// every template package at startup — and so a user who only
// installs @reactwright/template-essay isn't forced to install the
// others.

import type { ComponentType } from "react";

export type TemplateName = "essay" | "ieee" | "report";

const TEMPLATE_PACKAGES: Record<TemplateName, string> = {
  essay: "@reactwright/template-essay",
  ieee: "@reactwright/template-ieee",
  report: "@reactwright/template-report"
};

export function normalizeTemplateName(value: string | undefined): TemplateName {
  if (value == null || value.length === 0) return "essay";
  const lowered = value.toLowerCase();
  if (lowered === "essay" || lowered === "ieee" || lowered === "report") {
    return lowered;
  }
  throw new Error(
    `Unknown template "${value}". Supported templates: essay, ieee, report.`
  );
}

export async function loadTemplateComponent(name: TemplateName): Promise<ComponentType> {
  const pkg = TEMPLATE_PACKAGES[name];
  const mod = (await import(pkg)) as { Template?: unknown };
  if (typeof mod.Template !== "function") {
    throw new Error(
      `Template package "${pkg}" does not export a Template function. ` +
        `Check that the package is installed in your project.`
    );
  }
  return mod.Template as ComponentType;
}
