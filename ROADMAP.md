# Roadmap

Items deferred out of the current work, with where they came from.

## Next up

- **Q₈ arrows** — `groups/drafts/q8.group.json` is stubbed and waiting.
  `npm run check` grades it. Finishes Carter exercise 4.6(b).
- **Exercise generator** — deal a random group, blank some cells, check answers.
  This is the actual ask: *"more repetition on groups, their Cayley diagrams, and
  their multiplication tables."* A book gives six exercises; this gives unlimited
  ones on groups we choose, with answers verifiable two independent ways.
- **Cayley diagram rendering** — currently tables only. Wanted, but it is a real
  graph-layout problem and must not become a substitute for doing mathematics.

## Library growth

- **Import Group Explorer's `.group` XML** (LGPL-3.0, Nathan Carter & Ray Ellis —
  the same Carter as the book). Would bring ~62 groups: A₄, A₅, dihedrals, the
  quasihedral 16. The data are mathematical facts, not code.
  **The wrinkle is the interesting part:** GE stores the *multiplication table*,
  not arrows. Importing means running the machine backwards — given a table, find
  a generating set and derive the arrows. Worth doing as an exercise, not a chore.
- **Relations between groups** — `isSubgroupOf`, `isIsomorphicTo`. Deliberately
  *not* fields on each file (codex, plan review round 1): they are cross-file
  facts and want a separate index. That index is what turns the library into an
  ontology rather than a folder.

## Hardening

- **Empty-string element names** produce a slightly garbled message
  (`arrows.["a"] must be a non-empty string`). *codex, code review round 3 —
  found by probing, not flagged as blocking.* Elements should probably be
  required non-empty at phase 2 with a message that reads properly.
- **Aggregate errors across phases.** Validation stops at the first failing phase
  so messages stay specific. For a file with problems in several phases the
  author currently fixes one layer, re-runs, and discovers the next. Acceptable
  for now; revisit if it becomes annoying in practice.
- **`isAssociative` is O(n³).** Fine to n ≈ 24, irrelevant below that. Will matter
  if the GE import lands groups of order 168.

## Notes on process

Three defects in this round were found by review rather than by testing, and two
of them by reviewers *tripping over* the code rather than reading it:

- `npm run check` was already bound to `main.ts` and would have silently shadowed
  the new command — codex hit it while running the plan review.
- `loadLibrary()` resolved `groups/` against the process cwd, so it only worked
  from the repo root — codex hit a raw `ENOENT` running from its sandbox.

Both were invisible to the test suite because the tests always ran from the right
directory with the right scripts. Worth remembering: a reviewer with a different
environment is a fuzzer you did not have to write.
