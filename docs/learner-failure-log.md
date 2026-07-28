# The failure log — where one real learner actually got stuck

Evidence base for the tutorial sequence in `PRD-webapp.md`.

These are extracted from a running log kept while the author learned group theory
from Carter's *Visual Group Theory*, 2026-07-22 onward. Each entry is a place he
got stuck, with what unstuck him and whether it held.

**This is measured data on one learner, not a guess at what is hard.** The lesson
order in the PRD is derived from it rather than from a textbook contents page.

---

## The load-bearing errors, in the order they cost the most

### 1. Believed a group's elements were the square's CORNERS — cost 2 days

> *"i think of the elements as the members of the set. like the 1,2,3,4 corners
> of the square, nouns. i think of actions as the operations, like rotate 90
> degrees, or flip horizontally."*

Everything downstream fails from here: Cayley diagrams label nodes with actions,
multiplication tables combine actions, "the elements ARE the actions" is
incomprehensible.

**What fixed it — two checks he could run himself:**
- **count:** D₄ has 8 elements, the square has 4 corners. 8 ≠ 4.
- **operation:** "corner 1 · corner 3" is meaningless; "rotate 90 · flip" is not.
  Moves compose, corners do not. Only one of those sets can be a group.

**⚠ It had surfaced two days earlier and been recorded as resolved.** It was not.
Two days of material were built on top of it.

### 2. "Order" means two unrelated things — cost about an hour

Group order (how many elements) versus element order (how many presses to return
to the identity). Same word. Nobody warns you.

Compounded by identical notation: `|G|` is the group's size, `|a|` is an
element's order. **Same bars, meaning determined by what is inside them.**

His original claim — *"apply a generator |G| times and you return to e"* — turned
out to be **true**, and was initially marked wrong. Two readings hide in it:
- "if you press it |G| times you land home" — ✅ always true, a real theorem
- "it TAKES |G| presses" — ❌ false whenever the element's order is smaller

### 3. Notation anxiety — resolved in 30 minutes

> *"i feel shaky when i see them. like i want to cry actually."* (about `∈`)

Fixed with a decoder ring: symbol → plain sentence → the SQL/code he already
knew. Then a spaced-repetition trainer. Full-board fluency in three short
sessions.

**The concept was never the problem. The notation was.**

### 4. ℚ vs ℤ — three sessions of repetition failed, one structural visual worked

Stuck at the lowest box for three consecutive sessions against pure drilling.
One diagram showing ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ as nested rings — each ring *adding* something
— moved both to fluency in a single session.

**Structure beat repetition.** Cleanest before/after datum in the log.

### 5. Vocabulary collisions that recur

| trap | why it bites |
|---|---|
| "symmetry group" vs "symmetric group" | one letter, unrelated meanings |
| `Dₙ` vs `D₂ₙ` | some authors index by sides, others by order |
| `Q₄` vs `Q₈` | same group, Carter uses one, everyone else the other |
| six names for V₄ | Klein four-group, C₂×C₂, ℤ/2×ℤ/2, D₂, "the rectangle group" |
| `×` | Cartesian product, cross product, direct product, multiplication |

### 6. The teaching failure that produced the corrective protocol

After a week of apparently excellent progress:

> *"I read each chapter but I am unable to do the exercises. This has been true
> in all the chapters. I still feel unsure about the fundamentals... **You seem to
> think I get things I don't yet.**"*

**Diagnosis:** the tutor's probes were leading questions with the answers in the
setup. Correct replies evidenced *following*, not *command* — and were logged as
mastery. Sustained praise made it socially expensive to say "I'm lost."

**The fix took under an hour: stop explaining, start doing exercises.**

> *"It is super helpful to do the exercises with you."* — same evening

**⚑ The finding, which is why the PRD forbids an AI chat tutor:** conversational
tutoring has a systematic failure mode where fluent dialogue masks absent
competence. The tutor supplies scaffolding invisible to both parties. The very
responsiveness that makes the medium good at building intuition makes it bad at
measuring it.

### 7. Domain toll versus group theory

Authoring Q₈ required learning quaternion algebra — `i²=j²=k²=−1`, the ijk
cycle. **None of that is group theory.** It is the price of admission to one
group file.

> *"why do i need to know this info? it is another domain, not really group
> theory?"*

Correct, and he had to ask. **A learner who cannot tell domain toll from subject
matter will believe they are failing at group theory when they are failing at
quaternions.**

---

## What this implies for the tutorial

1. **Lesson 1 must be elements-are-moves.** It is the most expensive error and it
   blocks everything after it.
2. **Notation needs a decoder, not exposure.** Anxiety resolved in 30 minutes
   once symbols were mapped to things already known.
3. **Structure beats repetition on a stuck point.** When a learner is blocked,
   change the representation rather than adding reps.
4. **Warn about vocabulary collisions explicitly.** Every one above cost real time
   and none are the learner's fault.
5. **Exercises are the work.** Recognition is not mastery, and only unscaffolded
   production should count as progress.
6. **Label which parts are domain toll.**
