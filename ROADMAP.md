# Roadmap

Tracked as [GitHub issues](https://github.com/daveremy/cayley/issues). This file
keeps the reasoning; the issues keep the state.

| # | | |
|---|---|---|
| [1](https://github.com/daveremy/cayley/issues/1) | Fill in Q₈'s arrows | `next-up` |
| [2](https://github.com/daveremy/cayley/issues/2) | Generate group families instead of hand-authoring | `next-up` |
| [3](https://github.com/daveremy/cayley/issues/3) | Exercise generator | `next-up` |
| [4](https://github.com/daveremy/cayley/issues/4) | Render Cayley diagrams | `library` |
| [5](https://github.com/daveremy/cayley/issues/5) | Relations between groups | `library` |
| [6](https://github.com/daveremy/cayley/issues/6) | Empty-string element names | `hardening` |
| [7](https://github.com/daveremy/cayley/issues/7) | Aggregate errors across phases | `hardening` |
| [8](https://github.com/daveremy/cayley/issues/8) | `isAssociative` is O(n³) | `hardening` |
| [9](https://github.com/daveremy/cayley/issues/9) | Lazy library index | `hardening` |
| [10](https://github.com/daveremy/cayley/issues/10) | Host it, with a strong API and MCP | `library` |

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

- ~~**Import Group Explorer's `.group` XML**~~ — **dropped, 2026-07-27.** Not for
  licensing reasons but for better ones: the families a learner needs are all
  constructible from their definitions (issue #2), and generating them works for
  any *n* while teaching the construction. Importing a fixture library ships
  someone else's answers. Group Explorer stays valuable as an independent
  implementation to cross-check against. See the README for the full reasoning.
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
