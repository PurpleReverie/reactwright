---
"reactwright": patch
"@reactwright/template-ieee": patch
"@reactwright/template-essay": patch
"@reactwright/template-report": patch
---

Initial monorepo layout. The engine moved into
`packages/reactwright/` and three opinionated templates were
extracted into `@reactwright/template-{ieee,essay,report}`. No
behavioural changes to engine or template output; this entry exists
so the first multi-package publish records a coordinated version
bump.
