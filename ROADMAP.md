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
| [11](https://github.com/daveremy/cayley/issues/11) | Exercise type: solve a domain problem with structure | `learning` |
| [12](https://github.com/daveremy/cayley/issues/12) | Teach reading a table: is it a group? which one? | `learning` |

## The web app

Planned in [`docs/PRD-webapp.md`](docs/PRD-webapp.md), evidence base in
[`docs/learner-failure-log.md`](docs/learner-failure-log.md). Reviewed by codex
and gemini, three rounds.

**Each milestone independently shippable. M1 is the gate — if lesson 1 does not
work on its author, stop.**

| milestone | | issues |
|---|---|---|
| **M0** | pipeline works | [13](https://github.com/daveremy/cayley/issues/13) browser seam · [14](https://github.com/daveremy/cayley/issues/14) Astro+Vercel+budget · [15](https://github.com/daveremy/cayley/issues/15) build-time math · [16](https://github.com/daveremy/cayley/issues/16) design system · [17](https://github.com/daveremy/cayley/issues/17) a11y |
| **M1** | the format works | [18](https://github.com/daveremy/cayley/issues/18) lesson 1 — elements are moves |
| **M2** | it is a tutorial | [19](https://github.com/daveremy/cayley/issues/19) lessons 2–5 · [20](https://github.com/daveremy/cayley/issues/20) progress + sharing |
| **M3** | it is a tool | [21](https://github.com/daveremy/cayley/issues/21) explorer · [4](https://github.com/daveremy/cayley/issues/4) diagrams |
| **M4/5** | it is a service | [22](https://github.com/daveremy/cayley/issues/22) API + MCP |
| **M6** | it scales | [2](https://github.com/daveremy/cayley/issues/2) families · [3](https://github.com/daveremy/cayley/issues/3) exercise generator |

### The two principles that decide everything

**Everything displayed is COMPUTED from the engine.** No mathematics is ever
authored by hand. The app therefore cannot display something false, a lesson
written for C₄ works for C₅ for free, and authoring becomes prose plus a choice
of group. Demonstrated negatively on 2026-07-28: two frontier image models drew a
cross-product diagram with the vectors at 150° and a right-angle marker between
them, and neither noticed.

**The tutorial may never get ahead of its author.** Lesson *N* covers only
material earned through exercises. This paces the project honestly and stops it
sprawling into a Group Explorer clone.

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
