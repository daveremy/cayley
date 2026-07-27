# Plan: move groups out of code and into a validated data library

**Status:** draft, for review
**Date:** 2026-07-27
**Repo:** `~/code/cayley`

## Context

`cayley` is a learning instrument built alongside Nathan Carter's *Visual Group
Theory*. It stores a group the way a Cayley diagram stores one — nodes plus one
arrow-map per generator — and derives everything else (multiplication table,
words, structural properties). It exists because a printed Cayley diagram cannot
tell you whether its arrowheads mean `x·g` or `g·x`, and that ambiguity cost real
time while working exercises.

The primary user is a **non-programmer** working through the book. He authors
groups; he does not write TypeScript. That constraint drives most of what follows.

## Current state

- `src/group.ts` — engine. Types (`Element`, `Generator`, `Word`, `Permutation`,
  `Words`, `Table`, `Group`), `words()` (BFS from identity = Carter Def 4.1),
  `multiply()` (walk y's word starting from x), `table()`, and structural checks
  (`isClosed`, `identityWorks`, `everyElementHasInverse`, `isAssociative`,
  `isLatinSquare`, `isAbelian`, `squares`, `allSelfInverse`).
- `src/groups.ts` — **C₅, C₄, V₄ hardcoded as TypeScript consts.** Q₈ stubbed.
- `src/group.test.ts` — 56 tests, four layers (axioms for every group / C₅ against
  a hand-built spreadsheet / properties distinguishing V₄ from C₄ / words).
- Node 25, `--experimental-strip-types`, zero runtime dependencies.

Verified: breaking one arrow in C₅ produces 12 test failures. Closure and
associativity still passed; the inverse and Latin-square checks were the sharp ones.

## Goal

Groups become **data files in a library**, loaded and validated on demand. No
group is defined in source. Adding a group means adding a file.

## Design

### 1. Two validation layers, because there are two kinds of wrong

| layer | mechanism | catches | when |
|---|---|---|---|
| shape | JSON Schema | missing fields, wrong types, malformed arrows | in-editor, while typing |
| laws | our existing check functions | not actually a group | at load |

JSON Schema cannot express "arrows.i must be a bijection" or "the operation must
be associative." Those are the checks we already wrote for tests. **The test suite
becomes the validator** — same code, two uses.

The shape layer earns its place specifically because VS Code honours `$schema`
natively: a JSON author gets red squiggles with no build and no run. That is the
compile-time feel, delivered to someone who does not compile.

### 2. File format

```json
{
  "$schema": "../schema/group.schema.json",
  "name": "V₄",
  "aliases": ["Klein four-group", "C₂ × C₂", "ℤ/2 × ℤ/2", "D₂", "the rectangle group"],
  "elements": ["N", "R", "B", "RB"],
  "identity": "N",
  "generators": ["R", "B"],
  "arrows": {
    "R": { "N": "R", "R": "N", "B": "RB", "RB": "B" },
    "B": { "N": "B", "B": "N", "R": "RB", "RB": "R" }
  },
  "notes": "Symmetries of a non-square rectangle.",
  "source": "hand-authored"
}
```

**Stored:** only what cannot be derived — elements, identity, generators, arrows,
plus human metadata (name, aliases, notes, source).

**Not stored:** the multiplication table, order, abelian-ness, element orders.
All derived. Anything both stored and derivable can disagree with itself.

`aliases` is load-bearing, not decoration: the same object is called V₄, the Klein
four-group, C₂×C₂, ℤ/2×ℤ/2, D₂, and "the rectangle group" in different sources.
Six names for one thing caused real confusion on 2026-07-25. Making them a
searchable field converts that from a recurring surprise into a lookup.

### 3. Layout

```
groups/                     the library — pure data
  c5.group.json
  c4.group.json
  v4.group.json
  q8.group.json             stub, to be filled by hand
schema/
  group.schema.json
src/
  group.ts                  engine, unchanged
  load.ts                   NEW — read, validate shape, validate laws
  group.test.ts             fixtures load from groups/
docs/
  PLAN-group-library.md     this file
```

### 4. `load.ts`

```ts
loadGroup(path: string): Group          // throws GroupValidationError
loadLibrary(dir = "groups"): Group[]    // all files, sorted by order then name
findGroup(nameOrAlias: string): Group   // alias-aware lookup
```

Errors must speak the domain, not the encoding:

```
✗ q8.group.json: generator "i" has no arrow out of node "-k"
✗ q8.group.json: arrows.j is not a permutation — both "1" and "-j" map to "j"
✗ q8.group.json: declared identity "1" fails — "1" · "i" = "j"
✗ q8.group.json: not associative — (i·j)·k = "-1" but i·(j·k) = "1"
```

Compare with what a generic validator gives: *"expected string at arrows.i.-k"* —
true and useless. The whole point of hand-rolling layer 2 is that the failure
message teaches the axiom that was violated.

### 5. Migration

1. Write `schema/group.schema.json`.
2. Convert C₅, C₄, V₄ to files; delete `src/groups.ts`.
3. Write `load.ts` with both validation layers.
4. Repoint `group.test.ts` at the library; keep the hand-built C₅ table as the
   ground-truth fixture (it is the one thing verified against paper).
5. Add a test that every file in `groups/` passes the laws — so the library
   audits itself as it grows.
6. Leave `q8.group.json` as a stub with elements and identity filled in and
   arrows empty, for the user to complete.

## Non-goals (explicitly out of scope)

- Rendering Cayley diagrams. Tables only, for now.
- Importing Group Explorer's `.group` XML. Wanted later — it would bring ~62
  groups — but GE stores the *multiplication table*, not arrows, so importing
  means running the machine backwards (given a table, find generators and derive
  arrows). Interesting, separate, later.
- Any group large enough for performance to matter. `isAssociative` is O(n³) and
  that is fine at n ≤ 24.
- A UI.

## Resolved (codex review, round 1)

All six questions answered; the reviewer also found one contradiction in the
original draft, recorded below.

1. **JSON Schema: yes.** Justified by authoring ergonomics, not runtime safety —
   the schema exists so a non-programmer gets editor feedback. Keep it strictly
   shape-only; `load.ts` owns every domain error.
2. **Store `identity`.** Derivable, but conceptually authored — the identity is
   known and named in the book workflow. Storing it also yields a better failure
   (*"declared identity fails"* beats *"could not infer identity"*).
3. **Store `generators`.** Not merely derivable metadata: the chosen generating
   set determines the Cayley diagram, the words, and the learner's mental model.
   Two generating sets for the same abstract group are different authored objects.
4. **Collect errors per file; keep the success path simple.**
   `loadGroup(path)` throws a `GroupValidationError` carrying *all* issues found
   in that file, not just the first. `loadLibrary()` returns a plain `Group[]`
   when everything is valid and throws a `LibraryValidationError` aggregating
   per-file errors otherwise. The happy path stays uncomplicated.
5. **`aliases` stays in the file.** Aliases are names for *this* group, so they
   are local. Cross-file relations (`isSubgroupOf`, `isIsomorphicTo`) are facts
   *between* groups and will want a separate index when they arrive — not a field
   on each file.
6. **"Generators actually generate" becomes an explicit law** with its own error.
   Unreachable elements are a primary authoring mistake, not an incidental
   `multiply` throw:

   ```text
   ✗ q8.group.json: generators ["i","j"] do not reach elements ["-k"]
   ```

### ⚠ Contradiction found by review — resolved

The original draft wanted **both** an incomplete `q8.group.json` stub in `groups/`
**and** a test asserting every file in `groups/` satisfies the laws. Those cannot
both hold: the stub fails by construction.

**Resolution — `groups/drafts/`:**

```
groups/            valid, law-checked, part of the library
groups/drafts/     work in progress, NOT loaded, NOT law-tested
```

`loadLibrary()` reads `groups/*.group.json` only, non-recursively. Drafts are
invisible to it.

This also gives the authoring loop its shape, which matters more than the
directory layout:

```
npm run check groups/drafts/q8.group.json
```

Validates a single file and prints every remaining problem in domain language.
Edit, re-run, repeat until it passes, then move the file into `groups/`. That is
the working loop for a non-programmer authoring sixteen arrows by hand — the
program tells you exactly what is still wrong, in the vocabulary of the subject.

## Validation pipeline (five phases, ordered by dependency)

Each phase assumes the previous one passed, so errors stay specific rather than
cascading:

```
1. parse JSON                  is it even JSON?
2. schema / shape              required fields, correct types
3. domain shape                elements unique; identity ∈ elements;
                               generators ⊆ elements; every arrow map total
                               over elements; every target ∈ elements;
                               every arrow map bijective
4. reachability                generators actually generate — BFS covers all
5. group laws                  closure, identity behaves, inverses exist,
                               associativity, Latin square
```

Phase 3's bijectivity check is worth its own note: an arrow map that is not a
bijection is not a permutation, and catching it *there* produces a far better
message than letting it surface later as a Latin-square failure.

## Architectural constraint (from review)

`src/group.ts` stays **pure and file-unaware** — no JSON, no schemas, no `fs`.
All encoding concerns live in `load.ts`. The engine knows about groups; the
loader knows about files.
