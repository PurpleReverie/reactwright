# Contributing to Reactwright

Thanks for your interest. This file covers the moving parts of the
workspace; for engine architecture see [`CLAUDE.md`](./CLAUDE.md), and
for the canonical behaviour spec see [`docs/spec.md`](./docs/spec.md).

## Prerequisites

- Node.js ≥ 20 (CI runs 22)
- pnpm ≥ 9
- A local Chromium for `mockup:all` (Chrome works; otherwise point
  `PUPPETEER_EXECUTABLE_PATH` at a Chromium binary)

## Setup

```sh
git clone https://github.com/reactwright/reactwright.git
cd reactwright
pnpm install
```

## Working in the workspace

The repo is a pnpm + Turborepo monorepo. Workspace globs:

```
packages/*       # engine, templates, adapters
examples/*       # runnable sample documents (not published)
```

### Common commands

```sh
# whole workspace
pnpm test                                      # 129 unit tests
pnpm check                                     # typecheck every package
pnpm mockup:all                                # render every example

# per-package
pnpm --filter reactwright test
pnpm --filter @reactwright/template-ieee check
pnpm --filter @example/story-bible mockup
```

The Turbo task graph (`turbo.json`) declares `^build` dependencies, so
`pnpm test` builds upstream packages before running downstream tests.

## Adding code

### Engine changes

See [`CLAUDE.md`](./CLAUDE.md) §"Where to add / modify" for the
touchpoint table. The two long checklists you'll most often consult:

- **New IR primitive** — IR type → factory + grammar/dispatch entry →
  resolver → renderer. See §"Where to add / modify".
- **Making a node selectable by `<rule>`** — five touchpoints. See
  §"className propagation checklist".

### Template changes

Templates live in `packages/template-*/src/`. Each exports a
`Template` component (plus optional helpers like `IEEEFrontMatter`).
A template package's responsibility is the look — no engine-internal
imports beyond `reactwright/jsx` and the public types.

### Example changes

Each example is a workspace package (`@example/*`) with a `mockup`
script that drives the engine CLI against its entry `.tsx`. To add a
new example:

1. Create `examples/<name>/` with `<name>.tsx` and a `package.json`
   matching the existing examples (`@example/<name>`, private,
   workspace dependencies).
2. Add a one-paragraph `README.md` describing what it demonstrates.
3. `pnpm install` (registers the new workspace package).
4. `pnpm --filter @example/<name> mockup` — must produce healthy
   `.html` and `.pdf` outputs in `build/`.

## Tests

```sh
pnpm --filter reactwright test
```

The engine's tests live in `packages/reactwright/tests/`. Use
`node --test`'s built-in assertions; no Jest, no Vitest. For changes
that touch the styling dialect, add a one-line case to
`tests/styles-integration.test.tsx` as well.

For HTML-emit refactors that should be byte-stable, snapshot
`build/mockups/*.html` before the change and diff after.

## Versioning + releases (Changesets)

Reactwright uses [Changesets](https://github.com/changesets/changesets).

**Every PR that changes published behaviour needs a changeset.**

```sh
pnpm changeset
```

The CLI asks which packages changed and the bump kind (`patch`,
`minor`, `major`); it writes a `.changeset/<random>.md` file
containing the prompt for that release's changelog. Commit it
alongside your code.

On merge to `main`, the release workflow:

1. Sees the pending changesets and opens (or updates) a "Version
   Packages" PR that runs `changeset version` — bumping
   `package.json`s, regenerating `CHANGELOG.md`s, and deleting the
   consumed changeset files.
2. When that PR merges, the workflow runs `changeset publish`, which
   pushes the bumped packages to npm.

If you're only changing internal tooling, examples, docs, or CI
configuration, no changeset is needed.

## Commit style

- Imperative subject, under 70 characters when possible.
- Body wraps at ~72 columns and explains the *why*.
- Group related changes per commit; avoid blob commits that touch
  many unrelated files.

## Filing issues

When reporting a bug, please include:

- A minimal `.tsx` reproduction (the smaller, the faster a fix
  lands).
- The exact `pnpm`, Node, and OS versions.
- For PDF-rendering issues: the Chromium build / Chrome version
  Puppeteer connected to.

## Code of conduct

Be kind. Be specific. Be willing to read someone else's code with
charity. If a maintainer asks for a change, please assume there's a
reason; if you disagree, say so and we'll discuss it.
