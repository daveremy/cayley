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

Exactly the way a Cayley diagram stores one — nodes, plus one arrow-map per
generator. No algebra is imported; the diagram *is* the definition.

```ts
export const C5: Group = {
  elements: ["e", "a", "a2", "a3", "a4"],
  identity: "e",
  generators: ["a"],
  arrows: { a: { e: "a", a: "a2", a2: "a3", a3: "a4", a4: "e" } },
};
```

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

## Next

- [ ] Q₈ arrows (stubbed in `src/groups.ts`)
- [ ] render Cayley diagrams, not just tables
- [ ] generate exercises — unlimited repetition on groups we choose
- [ ] walk Carter ch. 5 (families) by generating C₃/C₄/C₅/C₆ and D₃/D₄/D₅ side by side
