# @reactwright/template-essay

## 0.1.1

### Patch Changes

- Fix consumer install/build failure introduced in 0.1.0.

  - Templates with bibliography support (`book`, `essay`, `ieee`, `ieee-report`,
    `report`) imported `Bibliography` via a deep relative path that only
    resolved inside the monorepo, breaking once installed from npm. The
    import now uses the `reactwright/userland` package entry.
  - Every template `template.tsx` now imports `React` explicitly. The
    consumer-side `tsx` runtime does not apply the host project's tsconfig
    to files in `node_modules`, so it defaults to the classic JSX transform
    (`React.createElement(...)`) and fails with "React is not defined"
    without an explicit React import.
  - `create-reactwright-doc` now writes a `tsconfig.json` next to the
    generated `.tsx` and emits an explicit `import React from "react";`, so
    the scaffolded build works end-to-end against published packages.
  - `@reactwright/markdown` and the templates are republished so their
    tarballs carry concrete dependency versions rather than the unresolved
    `workspace:*` strings shipped in 0.1.0.
