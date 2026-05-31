# Monorepo Migration Checklist

Convert the current single-package repo into a pnpm workspaces +
Turborepo + Changesets monorepo. Behaviour-preserving (mockup output
byte-stable through the migration); paths just move.

Estimated effort: one focused day if done as a single PR. Can be
incremental if a longer-running branch is acceptable.

## Phase 0 — Decisions to lock first

- [ ] Confirm package naming: core = `reactwright`, templates = `@reactwright/template-<name>`, adapters = `@reactwright/<concern>`
- [ ] Confirm npm org `reactwright` is available and claim it (or pick a fallback like `@taurajgreig/*`)
- [ ] Confirm GitHub repo rename from `react_doc` → `reactwright`
- [ ] Pick a tooling baseline: **pnpm 9+**, **Turborepo 2+**, **Changesets 2+**
- [ ] Decide initial versions: engine continues from `0.1.0`; new template packages start at `0.1.0`; bump engine to `0.2.0` on first multi-package release as a signal

## Phase 1 — Tooling skeleton (no file moves yet)

- [ ] Install pnpm globally if needed: `npm i -g pnpm`
- [ ] Create `pnpm-workspace.yaml` at repo root:
  ```yaml
  packages:
    - "packages/*"
    - "examples/*"
  ```
- [ ] Create `turbo.json` at repo root with pipelines: `build`, `test`, `check`, `mockup`
- [ ] Add `.changeset/config.json` (run `pnpm dlx @changesets/cli init`)
- [ ] Create `tsconfig.base.json` at repo root — packages extend from this
- [ ] Update `.gitignore` for `**/dist/`, `**/node_modules/`, `.turbo/`
- [ ] Add root `package.json` (rewrite to workspace root): `"private": true`, dev-only dependencies, scripts that proxy to turbo
- [ ] Commit: "Monorepo: tooling skeleton (no file moves)"

## Phase 2 — Move the engine into `packages/reactwright/`

- [ ] Create `packages/reactwright/` directory
- [ ] `git mv src/ packages/reactwright/src/`
- [ ] `git mv tests/ packages/reactwright/tests/`
- [ ] `git mv tsconfig.json packages/reactwright/tsconfig.json`; update its `extends` to point at `../../tsconfig.base.json`
- [ ] Move the current root `package.json` to `packages/reactwright/package.json`. Update `main`/`exports` paths if they reference `./src/...` (they already do — paths within the package don't change)
- [ ] Move `README.md` → `packages/reactwright/README.md` (and write a thinner repo-root README)
- [ ] Verify no import path uses `reactwright/...` style — all internal imports should be relative
- [ ] `pnpm install` at repo root
- [ ] `cd packages/reactwright && pnpm test` — all 129 tests pass
- [ ] Commit: "Monorepo: move engine to packages/reactwright"

## Phase 3 — Split templates into their own packages

Three templates to extract (`ieee`, `essay`, `report`). Same pattern for each:

For each of `mockups/ieee/`, `mockups/essay/`, `mockups/report/`:
- [ ] Create `packages/template-<name>/` directory
- [ ] `git mv mockups/<name>/* packages/template-<name>/src/`
- [ ] Write `packages/template-<name>/package.json`:
  - name `@reactwright/template-<name>`
  - `peerDependencies: { reactwright: "workspace:*", react: "^18 || ^19" }`
  - `devDependencies: { reactwright: "workspace:*" }` for tests
  - `exports: { ".": "./src/index.ts" }`
- [ ] Write `packages/template-<name>/tsconfig.json` extending the base
- [ ] Rename internal constants for clarity if needed (`IEEE_STYLES` → `STYLES`, `IEEE_CSS` → `CSS`; or keep IEEE-specific naming since the package IS the IEEE template)
- [ ] Update any internal imports
- [ ] Run `pnpm --filter @reactwright/template-<name> check`
- [ ] Commit per template: "Monorepo: extract template-<name>"

## Phase 4 — Move sample mockups to `examples/`

The `mockups/*.tsx` sample files become standalone example docs. Each example becomes its own workspace package (so it can depend on a template via `workspace:*`).

For each of `essay-sample`, `report-sample`, `ieee-strict`, `treatise`, `field-notes`, `newsletter`, `story-bible`:
- [ ] Create `examples/<name>/` directory
- [ ] Move the `.tsx` file (and any related assets in `tests/fixtures/` it references)
- [ ] Write `examples/<name>/package.json` declaring deps on the template + `reactwright`
- [ ] Add a `package.json` script: `"build": "reactwright build <name>.tsx"`
- [ ] Verify the example builds: `pnpm --filter @example/<name> build`
- [ ] Commit per example or batch: "Monorepo: move mockups to examples/"

## Phase 5 — Build orchestration

- [ ] Define Turborepo pipeline in `turbo.json`:
  ```json
  {
    "pipeline": {
      "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
      "test":  { "dependsOn": ["^build"] },
      "check": {},
      "mockup": { "dependsOn": ["^build"] }
    }
  }
  ```
- [ ] Add root scripts in repo-root `package.json`:
  ```json
  {
    "scripts": {
      "build": "turbo build",
      "test":  "turbo test",
      "check": "turbo check",
      "mockup:all": "turbo mockup --filter='./examples/*'"
    }
  }
  ```
- [ ] Migrate the existing `mockup:*` scripts. Each example owns its own.
- [ ] Verify byte-stable output: snapshot `build/mockups/*.html` before migration, diff after. Any differences must be from import-path normalization, nothing semantic.
- [ ] Commit: "Monorepo: build orchestration via turbo"

## Phase 6 — Changesets

- [ ] Create `.changeset/initial-migration.md` with a `major`/`minor`/`patch` entry for each package
- [ ] Verify `pnpm changeset version` produces sensible bumps (engine `0.2.0`, templates `0.1.0`)
- [ ] Verify `pnpm changeset publish --dry-run` shows the expected publish set
- [ ] Configure GitHub release workflow (`.github/workflows/release.yml`) using Changesets' GitHub Action
- [ ] Commit: "Monorepo: changesets configuration"

## Phase 7 — Adapter packages (greenfield, optional in initial migration)

Empty scaffold for future:
- [ ] `packages/cite-bibtex/` — `.bib` → JSX adapter (stub `package.json`, empty source)
- [ ] `packages/cite-csl/` — Citation Style Language adapter
- [ ] `packages/code-highlight/` — Shiki/Prism integration
- [ ] `packages/charts/` — SVG chart primitives
- [ ] `packages/create-reactwright-doc/` — `npm create` scaffolder CLI

These don't need to ship in v0.2; they just exist as empty packages so the layout is visible.

## Phase 8 — CI / GitHub

- [ ] Replace any existing `.github/workflows/*.yml` with workspace-aware versions: `pnpm install`, `pnpm test`, `pnpm check` at root
- [ ] Add a release workflow that runs `pnpm changeset publish` on push to `main` after a version PR merge
- [ ] Add a contributing guide (`CONTRIBUTING.md`) explaining the workspace layout + commands
- [ ] Update GitHub repo description + tags

## Phase 9 — Docs

- [ ] Rewrite root `README.md` to explain the monorepo: what's in each package, how to install, how to scaffold a new doc
- [ ] Move spec/plan docs from `docs/` to either repo-root `docs/` (general) or `packages/reactwright/docs/` (engine-specific) — split by audience
- [ ] Update CLAUDE.md "Project structure" section to reflect packages/
- [ ] Update `docs/decisions.md` with the monorepo decision
- [ ] Commit: "Monorepo: docs + README rewrite"

## Phase 10 — Verification

- [ ] Fresh clone test: `git clone`, `pnpm install`, `pnpm test`, `pnpm mockup:all` — every command works first try
- [ ] All 7 mockup PDFs byte-stable (or healthy if any path-related bytes shift)
- [ ] All 129 tests pass
- [ ] `pnpm changeset publish --dry-run` shows correct package set with correct deps
- [ ] Search for any remaining references to `mockups/` in `src/`, docs, or scripts — replace with new paths
- [ ] No package depends on `reactwright` via a non-`workspace:*` range internally

## Phase 11 — First multi-package publish

After migration lands on main:
- [ ] `pnpm changeset` to write the migration changelog entry
- [ ] Open release PR (Changesets' action does this automatically)
- [ ] Merge → publishes `reactwright@0.2.0`, `@reactwright/template-{ieee,essay,report}@0.1.0`
- [ ] Announce on GitHub Discussions / project README

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Import-path drift breaks builds | Use `git mv` so blame survives; grep for absolute paths post-move |
| React duplication across packages | All template packages declare `react` as `peerDependency`, not `dependency` |
| Mockup output byte-drift | Snapshot HTML before; diff after; explain any byte change |
| Test runner can't find tests across workspaces | Each package has its own `npm test`; root `pnpm test` fans out via turbo |
| Long-running branch conflicts | Do it as a single big PR over 1-2 days, not a multi-week branch |

## Things NOT to do during migration

- Don't rename any exported symbols (touching IR types, factory names, JSX intrinsics) — keep all renames for a separate PR
- Don't change tsconfig strict-flags — same compile semantics
- Don't add features — the migration is path-moves only
- Don't deprecate or remove anything — the engine's deprecation status is unchanged
- Don't switch test runners — stay on `node --test`

## Reference projects to study

- **TanStack** (`tanstack/router`) — closest analogue: one engine + ecosystem of opinionated companions
- **Vite** (`vitejs/vite`) — pnpm workspaces + custom build orchestration, smaller footprint than turbo
- **Storybook** (`storybookjs/storybook`) — many packages, Changesets, similar release cadence
- **Astro** (`withastro/astro`) — pnpm + turbo + changesets, well-organized monorepo
