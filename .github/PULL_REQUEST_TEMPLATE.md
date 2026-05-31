## Description

What changed and why. Link the issue if there is one.

## Test plan

- [ ] `pnpm test` passes (`pnpm --filter reactwright test` for engine work)
- [ ] `pnpm check` clean (TypeScript)
- [ ] `pnpm mockup:all` produces healthy PDFs
- [ ] New tests added for the new behavior (or rationale for not)
- [ ] Mockup byte-diff explained (if HTML output changed)

## Checklist

- [ ] One logical change per commit; messages explain *why*
- [ ] Followed `CONTRIBUTING.md` workspace conventions
- [ ] Added a Changeset entry (`pnpm changeset`) if this affects a
      published package
- [ ] No personal identifying info, no `console.log` left in source,
      no secrets

## Notes

Anything reviewers should know — surprises, alternatives considered,
follow-ups for a later PR.
