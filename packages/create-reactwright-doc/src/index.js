#!/usr/bin/env node
// Scaffolder for new Reactwright documents.
//
// Usage:
//   npm create reactwright-doc my-doc -- --template=essay
//   npx create-reactwright-doc my-doc --template=ieee
//
// Creates <my-doc>/ with:
//   - package.json declaring deps on reactwright + the chosen template
//   - <my-doc>.tsx using <Template /> from the template package
//   - README.md with build instructions

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const TEMPLATES = {
  essay: {
    pkg: "@reactwright/template-essay",
    description: "MLA-style academic essay (Times 12pt double-spaced, Works Cited)"
  },
  ieee: {
    pkg: "@reactwright/template-ieee",
    description: "IEEE conference paper (two-column, numbered sections, numeric citations)"
  },
  report: {
    pkg: "@reactwright/template-report",
    description: "Technical/business report (single-spaced, decimal section numbering)"
  }
};

const REACTWRIGHT_VERSION = "^0.2.0";
const TEMPLATE_VERSION = "^0.1.0";

function parseArgs(argv) {
  let name = null;
  let template = "essay";
  for (const arg of argv) {
    if (arg.startsWith("--template=")) {
      template = arg.slice("--template=".length);
    } else if (arg === "--help" || arg === "-h") {
      return { help: true };
    } else if (!arg.startsWith("--") && name == null) {
      name = arg;
    }
  }
  return { name, template };
}

function printHelp() {
  console.log(`create-reactwright-doc — scaffold a new Reactwright document

Usage:
  npm create reactwright-doc <name> -- --template=<template>
  npx create-reactwright-doc <name> --template=<template>

Templates:
${Object.entries(TEMPLATES).map(([k, v]) => `  ${k.padEnd(8)}  ${v.description}`).join("\n")}

Defaults: --template=essay

After scaffolding:
  cd <name>
  npm install
  npm run build
`);
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }
  if (!args.name) {
    fail("Missing project name.\nUsage: npm create reactwright-doc my-doc -- --template=essay");
  }
  const template = TEMPLATES[args.template];
  if (!template) {
    fail(`Unknown template '${args.template}'. Available: ${Object.keys(TEMPLATES).join(", ")}.`);
  }

  const targetDir = path.resolve(process.cwd(), args.name);
  if (fs.existsSync(targetDir)) {
    fail(`Directory already exists: ${targetDir}`);
  }
  fs.mkdirSync(targetDir, { recursive: true });

  const entryFile = `${args.name}.tsx`;
  const pkg = {
    name: args.name,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      build: `reactwright build ${entryFile}`
    },
    dependencies: {
      [template.pkg]: TEMPLATE_VERSION,
      react: "^19.0.0",
      reactwright: REACTWRIGHT_VERSION
    }
  };

  fs.writeFileSync(
    path.join(targetDir, "package.json"),
    JSON.stringify(pkg, null, 2) + "\n"
  );

  fs.writeFileSync(
    path.join(targetDir, entryFile),
    starterTsx(args.template, args.name)
  );

  fs.writeFileSync(
    path.join(targetDir, "README.md"),
    starterReadme(args.name, args.template, entryFile)
  );

  console.log(`✓ Created ${args.name}/

  ${args.name}/
  ├── package.json
  ├── ${entryFile}
  └── README.md

Next steps:
  cd ${args.name}
  npm install
  npm run build

The build outputs ${args.name.replace(/\W/g, "_")}.html and ${args.name.replace(/\W/g, "_")}.pdf alongside the source.
`);
}

function starterTsx(templateKey, name) {
  const template = TEMPLATES[templateKey];
  return `import "reactwright/jsx";
import { Template } from "${template.pkg}";

export default function Document() {
  return (
    <document title="${name}" author="Anonymous">
      <Template />

      <section title="Introduction">
        <p>
          Welcome to your new Reactwright document. Edit this file to
          replace the starter content. Anything you can express in JSX
          flows through the engine to paginated HTML and PDF.
        </p>
        <p>
          See <a href="https://github.com/PurpleReverie/reactwright">the
          documentation</a> for the full primitive vocabulary.
        </p>
      </section>

      <section title="Next steps">
        <p>
          Try editing this section. Add more sections. Drop in figures,
          tables, citations. Run <code>npm run build</code> to regenerate
          the PDF.
        </p>
      </section>

      <refs>
        <ref-entry refKey="example">
          Example, A. (2026). <em>A Placeholder Reference</em>. Publisher.
        </ref-entry>
      </refs>
    </document>
  );
}
`;
}

function starterReadme(name, templateKey, entryFile) {
  return `# ${name}

A Reactwright document scaffolded with \`create-reactwright-doc --template=${templateKey}\`.

## Build

\`\`\`sh
npm install
npm run build
\`\`\`

This produces \`${entryFile.replace(/\.tsx$/, ".html")}\` and \`${entryFile.replace(/\.tsx$/, ".pdf")}\`.

## Edit

Edit \`${entryFile}\` to write your document. Reactwright primitives like
\`<section>\`, \`<p>\`, \`<figure>\`, \`<table>\`, and \`<cite>\` are
declared in JSX; the engine compiles them to paginated HTML + PDF.

Replace the bibliography stub with your real references in the
\`<refs>\` block, then cite them via \`<cite cite="key" />\`.

## Learn more

- Reactwright docs: https://github.com/PurpleReverie/reactwright
- Template (${templateKey}): https://github.com/PurpleReverie/reactwright/tree/main/packages/template-${templateKey}
`;
}

main();
