# create-reactwright-doc

Scaffolds a new Reactwright document with the template of your choice.

## Quick start

```sh
npm create reactwright-doc@latest my-doc -- --template=essay
cd my-doc
npm install
npm run build
```

## Templates

| Flag | Package | Description |
|------|---------|-------------|
| `--template=essay` (default) | `@reactwright/template-essay` | MLA-style academic essay, Times 12pt double-spaced, Works Cited bibliography |
| `--template=ieee` | `@reactwright/template-ieee` | IEEE conference paper, two-column, numbered sections, numeric citations |
| `--template=report` | `@reactwright/template-report` | Technical/business report, single-spaced, decimal section numbering |

## What you get

```
my-doc/
├── package.json     # deps: reactwright + chosen template + react
├── my-doc.tsx       # starter document using <Template />
└── README.md        # build + edit instructions
```

The starter is intentionally minimal — replace the bodies, add sections,
ship.

## License

MIT
