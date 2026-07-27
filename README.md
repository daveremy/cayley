# cayley

Learning group theory by building the instruments — Cayley diagrams,
multiplication tables, and generated exercises.

Built alongside Nathan Carter's *Visual Group Theory*, because a printed
diagram can't tell you which multiplication convention its arrowheads mean,
and that ambiguity costs real time.

## The one rule

Every arrow is **right multiplication**:

```
arrows[g][x] === "x · g"      start at x, follow the g-arrow
```

Stated once, in code, so it is never a guess.

## How a group is stored

**As a data file, never as code.** Exactly the way a Cayley diagram stores one —
nodes, plus one arrow-map per generator. No algebra is imported; the diagram *is*
the definition. Adding a group means adding a file.

```json
{
  "$schema": "../schema/group.schema.json",
  "name": "C₅",
  "aliases": ["ℤ/5", "cyclic group of order 5"],
  "elements": ["e", "a", "a2", "a3", "a4"],
  "identity": "e",
  "generators": ["a"],
  "arrows": { "a": { "e": "a", "a": "a2", "a2": "a3", "a3": "a4", "a4": "e" } }
}
```

Stored: only what cannot be derived. **Not** stored: the multiplication table,
the order, abelian-ness. Anything both written down and derivable can disagree
with itself.

`aliases` is load-bearing. V₄ is also the Klein four-group, C₂×C₂, ℤ/2×ℤ/2, D₂,
and "the rectangle group" — six names for one object. `findGroup()` resolves any
of them.

## Validation — two kinds of wrong

```
shape  →  schema/group.schema.json  →  red squiggles in the editor, while typing
laws   →  src/load.ts               →  at load
```

JSON Schema cannot say *"arrows.i must be a bijection"* or *"the operation must be
associative."* A file can satisfy the schema completely and still not be a group.
So the schema is an authoring aid; every mathematical claim is checked in code,
in five phases:

```
1. parse           is it JSON?
2. shape           required fields, right types
3. domain shape    identity ∈ elements · generators ⊆ elements · arrows total
                   · targets valid · each arrow a permutation
                   · arrows[g][identity] === g       ← the labelling law
4. reachability    the generators actually generate
5. group laws      closure · identity · inverses · associativity · Latin square
```

**The labelling law is not redundant.** A file can be bijective, generate every
element, and satisfy all five group laws while its arrow labelled `r` actually
performs `r³`. Every check passes; every table cell is wrong against the printed
names. Only `arrows[g][identity] === g` catches it — and it holds because
`e·g = g`, the identity being the one node where *where I arrive* and *what I
multiplied by* coincide.

Failures speak group theory, not JSON:

```
✗ q8.group.json — not a group yet. 2 problem(s):
  [phase 3] generator "i" has no arrow out of "i", "j", "k", "-1" …
            — every node needs one arrow of each colour leaving it
```

## Authoring a group

```
npm run check groups/drafts/q8.group.json
```

Edit, run, read what is still wrong, repeat. When it passes, move the file from
`groups/drafts/` into `groups/`. Drafts are never loaded and never law-tested.

## How multiplication works

`y` names a path from the identity. To compute `x · y`, walk that same path
but start at `x`. That is Carter's Definition 4.1, executable.

## Run

```
npm start
```

Prints tables for C₅, C₄, V₄ and checks four structural properties: the
identity behaves, every element has an inverse, the table is a Latin square,
and whether the group is abelian.

C₅ is checked against a table built by hand in a spreadsheet on 2026-07-26.
All 25 cells must agree.

```
npm test
```

82 tests. The axiom layer runs against **every** file in `groups/`, so the
library audits itself as it grows.

## Next

- [ ] Q₈ arrows (stubbed in `groups/drafts/q8.group.json`)
- [ ] render Cayley diagrams, not just tables
- [ ] generate exercises — unlimited repetition on groups we choose
- [ ] walk Carter ch. 5 (families) by generating C₃/C₄/C₅/C₆ and D₃/D₄/D₅ side by side

## License

MIT. See [LICENSE](LICENSE).

## Relationship to Group Explorer

[Group Explorer](https://github.com/nathancarter/group-explorer) is Nathan
Carter and Ray Ellis's group-theory visualisation software, LGPL-3.0. Carter is
also the author of *Visual Group Theory*, the book this project was built
alongside — the book is effectively its manual.

**This project contains none of its code.** Everything here is written from
scratch, which is why MIT is available.

Group Explorer ships a library of `.group` XML files. We deliberately do **not**
import them, for a reason that is practical before it is legal: the families a
learner needs — cyclic, dihedral, symmetric, alternating, direct products — are
all *constructible from their definitions*. Generating them gives you any n,
takes a few dozen lines, and teaches the construction. Importing a fixture
library gives you someone else's answers.

Where Group Explorer is genuinely useful to us is as a **cross-check**: an
independent implementation to compare results against. If we ever do import
anything, it will be mathematical facts only — a multiplication table is a fact,
not an authored work — with clear attribution, and never the prose.
