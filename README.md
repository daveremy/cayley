# cayley

**Group theory, three ways at once.**

Every idea here is shown as a picture, as notation, and as code — the same fact
in three registers, so you can enter through whichever one you already trust and
use the others to check yourself.

A group is a set of things you can *do*, where every move can be undone. Rotating
a square. Shuffling a deck. Flipping a switch. Turning a Rubik's cube. It is the
mathematics of what stays the same while everything moves.

It is also, traditionally, taught in a notation that makes competent adults feel
stupid. This is an attempt at the other thing.

```
∀x ∈ G, ∃y ∈ G :  xy = e             the notation
"every x has some y that undoes it"   the reading
elements.every(x =>                   the code
  elements.some(y => t[x][y] === e))
```

`∀` is `.every()`. `∃` is `.some()`. Nobody tells you that, and it takes about
four seconds to learn.

The code register is the one nothing else offers, so it gets real weight here.
But it is a way in, not a requirement — **ignore it entirely and the pictures and
notation still carry the whole course.**

---

## Try it

```bash
git clone https://github.com/daveremy/cayley && cd cayley
npm link

cayley list                  every group we know about
cayley show V4               one group, in full
cayley table C5              the multiplication table
cayley mul Q8 i j            one product — and the path walked to get it
cayley mul Q8 j i            the same two things, other order. different answer.
cayley diff C4 V4            two groups the same size that are not the same group
```

Names are forgiving. `C5`, `c5`, `C₅` and `the rectangle group` all work, because
`₅` is not on your keyboard and life is short.

Zero dependencies. Node 25+. No build step.

---

## What makes it different

**Everything is computed.** No multiplication table in this repository was typed
by a human. Five arrows produce all twenty-five cells of C₅, and if the arrows are
wrong the file will not load. The tool cannot show you mathematics that is false —
a lower bar than it sounds, and one most educational software fails.

**A group is stored the way a diagram stores it** — nodes, plus one arrow-map per
generator. That is the entire file format:

```json
{
  "name": "C₅",
  "elements": ["e", "a", "a2", "a3", "a4"],
  "identity": "e",
  "generators": ["a"],
  "arrows": { "a": { "e": "a", "a": "a2", "a2": "a3", "a3": "a4", "a4": "e" } }
}
```

Five facts. Everything else — the table, the element orders, the subgroups, every
structural property — is derived. Cayley diagrams are not a friendly picture of a
multiplication table. They are **smaller than it**, and lose nothing.

**Errors speak group theory.** When your file is not a group, you are told why in
the vocabulary of the subject:

```
✗ q8.group.json — not a group yet. 2 problem(s):
  [phase 3] generator "i" has no arrow out of "j", "k", "-1" —
            every node needs one arrow of each colour leaving it
```

Not `expected string at arrows.i.-k`. True, and useless.

---

## The convention, stated once, in public

```
arrows[g][x] === "x · g"        start at x, follow the g-arrow
```

This exists because a printed Cayley diagram **cannot tell you** whether its
arrowheads mean `x·g` or `g·x`; the two disagree in any non-abelian group; and an
afternoon was lost to exactly that. A drawing cannot state its own convention.
A line of code can.

---

## Structure

```
groups/          the library. pure data. add a file, it joins the test suite.
groups/drafts/   work in progress. never loaded, never trusted.
schema/          JSON Schema — shape only. it cannot check mathematics.
src/group.ts     the mathematics. zero imports. runs anywhere.
src/load.ts      files → validated groups, in five phases
src/commands.ts  input → data. never prints.
src/cli.ts       data → text. no mathematics lives here.
docs/            the plan, and the failure log it was derived from
```

`npm test` runs 196 of them. The axiom layer runs against **every** file in
`groups/`, so the library audits itself as it grows. C₅ is additionally checked
against a table someone built by hand in a spreadsheet — the computer should have
to agree with a human at least once.

---

## Adding a group

```bash
cp groups/c5.group.json groups/drafts/mine.group.json
$EDITOR groups/drafts/mine.group.json
npm run check groups/drafts/mine.group.json
```

It tells you what is still wrong. Repeat until it stops complaining, then move it
into `groups/` and the test suite adopts it.

Five phases must pass:

```
1  parse           is it even JSON
2  shape           right fields, right types
3  domain shape    every node has an arrow of each colour; each is a permutation;
                   and arrows[g][identity] === g   ← the labelling law
4  reachability    your generators actually generate
5  the group laws  closure, identity, inverses, associativity, latin square
```

The labelling law in phase 3 looks redundant and is not. A file can be bijective,
generate everything, and satisfy all four axioms while its arrow labelled `r`
quietly performs `r³`. Every other check passes; every cell is wrong against the
printed names. Only that one catches it.

---

## Why "cayley"

Arthur Cayley got there first, repeatedly, and so the diagrams, the tables and the
theorem are all named after him. This seems excessive but is not our fault.

The theorem is the good one: **every group is secretly a group of permutations.**
Whatever your group is *about* — rotations, quaternions, card shuffles — it is
isomorphic to some set of ways of shuffling its own elements. There is no escaping
permutations. This is either profound or unsettling, depending on the hour.

---

## Documentation

| | |
|---|---|
| [`docs/PRD-webapp.md`](docs/PRD-webapp.md) | where this is going. reviewed to death. |
| [`docs/learner-failure-log.md`](docs/learner-failure-log.md) | every place one real learner got stuck, with timestamps |
| [`ROADMAP.md`](ROADMAP.md) | milestones, linked to issues |

The failure log is the unusual one, and the most useful. Most curricula are built
from a table of contents. This one is built from a record of what actually went
wrong — including two days lost to believing a group's elements were the *corners*
of the square rather than the moves.

---

## Influences, and where we left them

Nathan Carter's *Visual Group Theory* is the best intuition-first treatment of
this material and shaped the visual approach throughout. Douglas Hofstadter's
*Gödel, Escher, Bach* is why anyone believes isomorphism is the interesting part.
[Group Explorer](https://github.com/nathancarter/group-explorer) (Carter and Ray
Ellis, LGPL-3.0) is the reference implementation for visualising all of this.

**We diverge deliberately**, and it is worth being explicit since the debt is real:

- **arrows as the primary format.** Most tools store multiplication tables.
  Arrows are smaller, and make the diagram the source of truth rather than a
  rendering of one.
- **validation as pedagogy.** The five phases exist to *teach by refusing*, not
  merely to reject.
- **the convention, in public.** Books state it once in chapter two and hope. It
  belongs in the file header, enforced in phase 3.
- **code as a third register**, alongside picture and notation. That is the whole
  premise, and no book can do it.

This project contains no Group Explorer code, which is why it can be MIT.

---

## Contributing

**Groups are welcome.** The validator is the review — if `cayley check` passes,
the mathematics is sound, which is most of what a reviewer would be doing anyway.

**Bugs and code:** ordinary pull requests.

**Lessons: by invitation, for now.** The tutorial cannot get ahead of the person
learning from it, and that constraint does not survive open contribution.

---

## Licence

**Code: MIT.** **Content — lessons, diagrams, the failure log: CC BY 4.0.**

Take the lessons and teach with them. Attribution is the whole ask.
