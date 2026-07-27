# Plan: a first-class CLI

**Status:** draft, for review
**Date:** 2026-07-27
**Repo:** `~/code/cayley`

## Context

`src/cli.ts` was written in ten minutes to answer "could we do this from the
command line?" It works, but it is a sketch: business logic mixed with printing,
no output contract, no tests, no exit codes, and three separate entry points
(`main.ts`, `check.ts`, `cli.ts`) that overlap.

The stated goal is a CLI good enough to be the primary interface, positioned so
that an HTTP API and an MCP server become adapters rather than rewrites.

The primary user is a **non-programmer** learning group theory. He will type
these commands dozens of times a day. Ergonomics are a correctness concern here,
not polish.

## Goal

One well-tested CLI exposing **existing** functionality, built on a command layer
that returns data rather than printing it.

## Non-goals

- **No new mathematics.** Everything exposed already exists in `group.ts` and
  `load.ts`. Exercise generation (#3), family generation (#2) and diagram
  rendering (#4) stay as issues.
- No HTTP server. No MCP server. The point is to make them cheap later, not to
  build them now.
- No TUI, no colours beyond what is already there, no interactive prompts.

## The architecture question, and why it decides everything

The reason a CLI usually cannot become an API is that its logic is entangled with
its printing. Avoid that once, up front:

```
        src/commands.ts        pure functions: input → data. No printing, no exit.
              │
     ┌────────┼────────┐
     │        │        │
  cli.ts   (later)   (later)
  format    HTTP      MCP
  + print   handler   tool
```

Every command is a function returning a plain object. `cli.ts` formats and
prints it; a future HTTP handler serialises it; a future MCP tool returns it.
None of them contain mathematics.

**Test consequence:** the command layer is pure and gets thorough unit tests.
The CLI adapter gets a small number of spawn-the-process smoke tests. That split
is what makes a CLI testable at all.

## Command surface (existing capability only)

| command | returns | today |
|---|---|---|
| `list` | every group with summary properties | ✅ |
| `show <group>` | one group in full | ✅ |
| `table <group>` | the multiplication table | ✅ |
| `mul <group> <x> <y>` | the product **and the path walked** | ✅ |
| `word <group> <element>` | the path from the identity | ✅ |
| `order <group> [element]` | element orders | ⚠️ lives in `cli.ts` — move it |
| `diff <a> <b>` | two groups side by side | ✅ |
| `check <file>` | validation report | ✅ in `check.ts` — fold in |
| `props <group>` | every structural property at once | ✅ scattered |

Nine commands, all wrapping code that already exists.

### Consolidation

Three entry points become one. `main.ts` is a demo that duplicates `list` and
`table`; `check.ts` becomes `cayley check`. Delete both.

## Output contract

Every command supports `--json`.

```
$ cayley mul C5 a2 a3
  a2 · a3 = e
  (start at a2, follow a then a then a)

$ cayley mul C5 a2 a3 --json
{"group":"C₅","x":"a2","y":"a3","product":"e","path":["a","a","a"]}
```

This is the single most important decision in the plan, because **the `--json`
shape is the future API response.** Designing it now means the HTTP layer is a
serialiser, not a redesign. It also makes the CLI scriptable and makes assertions
in tests exact rather than regex-matching prose.

Human output stays the default — the primary user is a person, not a pipeline.

## Exit codes

```
0   success
1   the operation failed for a legitimate domain reason
    (file is not a group; no such element)
2   usage error (unknown command, missing argument, unknown group)
```

Distinguishing 1 from 2 matters: "your file is not a group" and "you typed the
command wrong" are different problems and a script should be able to tell them
apart.

## ⚑ Typeability — a real defect, not polish

**You cannot currently type the group names.**

```
$ npm run g -- show C5
no group called "C5".
```

`C₅` uses U+2085 SUBSCRIPT FIVE. `V₄`, `ℤ/5` likewise. The library's aliases
include `Z5` but not `C5`, and no one is going to type `₅` dozens of times a day.

Two fixes, and I think both:

1. **ASCII aliases in every group file** — `C5`, `V4`, `Q8`, `Z5`.
2. **Normalise on lookup** — fold subscript digits to ASCII, strip spaces, lower
   case, so `c5`, `C₅`, `C 5` and `C5` all resolve.

Normalisation is the more robust of the two because it keeps working for groups
added later by someone who forgets to add aliases.

## Argument parsing

`node:util.parseArgs`, built in since Node 18. No dependency, no hand-rolled
flag loop. Handles `--json`, `--help`, `--`-separated positionals.

## Invocation

`npm run g -- show C5` is clumsy — the bare `--` confuses everyone eventually.
Add a `bin` entry:

```json
"bin": { "cayley": "src/cli.ts" }
```

`npm link` then gives a plain `cayley show C5`. Keep `npm run g` as an alias for
anyone who has not linked.

## Testing strategy

**Layer 1 — command layer (the bulk).** Pure functions, no process, fast.

```ts
assert.deepEqual(mulCommand("C5", "a2", "a3"),
  { group: "C₅", x: "a2", y: "a3", product: "e", path: ["a","a","a"] });
```

**Layer 2 — CLI adapter (a handful).** Spawn the real process, assert on stdout
and exit code. Slow, so keep it to: one happy path, one domain failure (exit 1),
one usage error (exit 2), one `--json` shape, one `--help`.

**Layer 3 — invariants.** Every command in the table above must: exist, respond
to `--help`, accept `--json`, and produce valid JSON when it does. Written as a
loop over the command list so a new command cannot be added without meeting them.

Layer 3 is the one that keeps the surface honest as it grows.

## Migration

1. `src/commands.ts` — pure command layer. Move `order()` here from `cli.ts`.
2. Name normalisation in `findGroup`, plus ASCII aliases in the group files.
3. Rewrite `src/cli.ts` as a thin adapter over the command layer using
   `parseArgs`.
4. `bin` entry in `package.json`; keep `npm run g`.
5. Delete `src/main.ts` and `src/check.ts`.
6. Tests, three layers.
7. Update README.

## Open questions for review

1. **Is a separate `commands.ts` over-engineering** for nine commands wrapping
   existing functions, given HTTP and MCP are speculative? The counter-argument
   is that it costs almost nothing now and is expensive to retrofit. But it does
   add a layer whose only current consumer is `cli.ts`.
2. **Should `--json` be exhaustive or minimal?** Exhaustive (`show` returns every
   derived property) makes it a better API but slower and noisier. Minimal keeps
   it fast but means the future API needs more endpoints.
3. **Exit code 1 vs 2** — is "unknown group" a usage error (2) or a domain error
   (1)? Argued 2 above, on the grounds that it is a typo, but "the group is not
   in the library" is arguably domain.
4. **Is normalisation risky?** Folding `C₅`→`C5` could in principle collide if a
   library ever holds two groups whose names differ only by subscript styling.
   Should the loader reject a library containing normalisation collisions?
5. **`bin` with `--experimental-strip-types`** — a shebang'd `.ts` file needs
   `#!/usr/bin/env -S node --experimental-strip-types`. Does that work reliably
   across shells and npm-link setups, or is a tiny `.mjs` shim safer?
6. **Should `check` accept stdin?** `cat foo.json | cayley check -` would suit
   piping, but no one is currently piping anything.
