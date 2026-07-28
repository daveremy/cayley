# Lesson 1 — Elements are moves

**Issue:** [#18](https://github.com/daveremy/cayley/issues/18) · **Milestone:** M1
**Status:** spec, pre-build

---

## Why this lesson exists

It is the most expensive error in [the failure log](./learner-failure-log.md).
Two days, from one belief:

> *"i think of the elements as the members of the set. like the 1,2,3,4 corners
> of the square, nouns."*

Everything downstream fails from there. Cayley diagrams label nodes with actions.
Multiplication tables combine actions. "The elements **are** the actions" is
incomprehensible until this lands.

**And it had surfaced two days earlier and been marked resolved.** It was not.
Two days of material were built on sand.

**This is the M1 gate.** If it does not work on its author, we stop and rethink
the format rather than writing lesson 2.

---

## What the learner can do afterwards

Falsifiable, in the learner's own words, unprompted:

1. State that D₄ has **8** elements, and that the square's 4 corners are not them
2. Give a reason — either the count (8 ≠ 4) or the operation (corners don't compose)
3. Read `|D₄| = 8` and `g.elements.length === 8` as the same claim as the picture

**Not** "clicked through the lesson."

---

## Screen by screen

### Screen 1 — a square you can push around

```
┌─────────────────────────────────────────┐
│                                         │
│         ┌───────────┐                   │
│         │ 1       2 │                   │
│         │           │    [ rotate ]     │
│         │ 4       3 │    [ flip  ]      │
│         └───────────┘                   │
│                                         │
│   things you have found:  (empty)       │
└─────────────────────────────────────────┘
```

Two buttons. The square animates. Corners are labelled so movement is visible —
that labelling is doing real work later, and is also the seed of the confusion,
which is fine because we are going to walk straight into it.

**No text yet. Let them push the buttons.**

### Screen 2 — the collection fills up

Each distinct arrangement joins a strip below:

```
found so far:   [▫1234]  [▫4123]  [▫3412]  ...        4 of ?
```

The counter says `of ?`, not `of 8`. **Do not give away the answer you are about
to ask for.**

**Prose, one line:** *"Keep going until nothing new appears."*

Rotating alone reaches 4. Most people stop there — which is exactly the setup.
Flipping opens the other four.

### Screen 3 — ⚑ THE PROBE

Only once the strip is full (all 8 found):

```
        How many elements does this group have?

              [ 4 ]      [ 8 ]      [ 16 ]

                    I don't know
```

Predict before reveal. Commit, then check. **The wrong answer is the interesting
one and it must be reachable.**

#### If they answer 4 — the money path

Do not say "incorrect."

```
That's the corners. Watch —

        corner 1  ·  corner 3  =  ?

There's no answer. It isn't a question. Corners don't combine.

        rotate 90°  ·  flip  =  ?

        [ shows the composite happening, then landing on a move
          already in the strip ]

That one has an answer, and it's one of the eight you found.

A group needs an operation. Only one of those two sets has one.
```

**Then re-ask.** Same question, same buttons. They answer it themselves.

#### If they answer 8

```
Right. So what are the corners?

              [ the elements ]
              [ what the group ACTS ON ]
```

The second probe catches someone who guessed 8 from the strip without the idea.

#### If they say "I don't know"

Not a penalty, and never scored as failure. Reveal a **structural hint**, not the
answer:

```
Count the shapes in your strip. Then count the corners of the square.
Are those the same number?
```

Then re-ask. Logged as `saidIDontKnow`, which is data about the lesson, not the
learner.

### Screen 4 — three registers, one fact

The product thesis on one screen:

```
┌──────────────────┬──────────────────┬──────────────────────────┐
│   the picture    │   the notation   │        the code          │
├──────────────────┼──────────────────┼──────────────────────────┤
│  all 8 moves,    │    |D₄| = 8      │  g.elements.length       │
│  each animating  │                  │  // → 8                  │
│  on hover        │  |G| = how many  │                          │
│                  │  elements G has  │  g.elements              │
│                  │                  │  // ["e","r","r2",...]   │
└──────────────────┴──────────────────┴──────────────────────────┘
```

**Every value here is computed** — `g` is the real D₄ from `groups/d4.group.json`.
Nothing is transcribed. If the file changed, this screen would change.

**Prose:** *"Those bars mean 'how many'. Same bars you know as absolute value,
different job — they mean size when a group is inside them."*

### Screen 5 — the boundary, named

Ends by marking what was and was not taught:

```
WHAT YOU LEARNED          the elements of a symmetry group are its MOVES.
                          the thing being moved is not in the group.

WHAT WE PARKED            why exactly 8, and not 6 or 12
                          what happens when you do two moves in a row
                          why "rotate then flip" ≠ "flip then rotate"

STILL A LIE               "elements are moves" is the useful reading for
                          symmetry groups. It is not the definition — ℤ under
                          addition is a group and 5 is happily just a number.
                          Cayley's theorem says the move-reading is ALWAYS
                          available. Lesson 8.
```

Parking out loud is a method commitment (PRD §8), not a flourish. It stops the
interesting thing hijacking the solid thing, and it shows the learner the
discipline rather than imposing it silently.

---

## Interactions required

| | |
|---|---|
| `SquareManipulator` | animated square, rotate/flip, tracks distinct arrangements |
| `ElementStrip` | the collection filling up, `n of ?` |
| `Probe` | multiple choice + **I don't know**, branching feedback |
| `ThreeRegisters` | picture / notation / code, all computed from one `Group` |

Only `SquareManipulator` and `Probe` need to be live islands. The rest can be
static (PRD §7.2).

---

## Constraints this lesson must honour

```
computed          every number and label from groups/d4.group.json (PRD §4)
predict first     the probe precedes any reveal
no leading        the question must not contain its answer
I don't know      present, unpenalised, gives structure not answers
domain language   feedback speaks group theory, never "incorrect"
colour-safe       the square's moves are never distinguished by colour alone
keyboard          fully operable. the square responds to arrow keys.
no-JS             prose and the notation panel readable without JavaScript
voice             wry, honest, never cute. §6.3c.
```

---

## Open questions

1. **Should the corners be numbered?** Numbering makes movement visible and
   *invites* the corners-are-elements error. That may be a feature — we want the
   error to happen here, under supervision, rather than in chapter 4.
2. **Reveal all 8 up front, or make them discover?** Discovery is better
   pedagogy and worse for someone returning to re-read. Perhaps a skip control.
3. **D₄ or the rectangle?** D₄ has the sharper count mismatch (8 moves vs 4
   corners). V₄'s 4-and-4 coincidence would hide the very thing being taught.
   **Leaning strongly D₄** for exactly that reason.
4. **What does "landed" mean, measurably?** Proposal: answers screen 3 correctly
   on first try *and*, a week later, restates the reason unprompted. The second
   half cannot be automated and should not be faked.
