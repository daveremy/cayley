# Voice

How this project writes. Applies to lessons, errors, docs, comments, and commits.

---

## The problem this fixes

The writing had drifted into a recognizable register. Confident, dense, and
tiring. Dave named it: *"complex to read at times. it looks like ai speak."*

Here are the actual tells, with real examples from this repo.

**Em-dashes doing the work of periods.**

```
before  This exists because a printed diagram cannot tell you whether its
        arrowheads mean x·g or g·x — the two disagree in any non-abelian
        group — and an afternoon was lost to exactly that.

after   A printed diagram can't tell you whether its arrows mean x·g or g·x.
        In a non-abelian group those give different answers. We lost an
        afternoon to it.
```

**Bold on every other phrase.** If four things are emphasized, nothing is.

**Verbal tics.** *genuinely, precisely, worth noting, load-bearing, in practice,
the thing is.* Cut them. They add length and no meaning.

**Announcing instead of saying.**

```
before  It's worth noting that the interesting part here is the count.
after   The count is the interesting part.
```

**Nominalizations.** *the extraction, the reversal, the deferral.* Use verbs.
Something extracted. We reversed it. We put it off.

**Three clauses where one would do.**

---

## Who to read

Not one model. Four, for different jobs.

**Carl Sagan — wonder without gush.** Short sentences next to long ones. Concrete
before abstract. He never talks down, and he never inflates. When he says
something is beautiful he has already shown you why.

> *"The Cosmos is all that is or ever was or ever will be."*

Nine words. No hedging.

**Richard Feynman — the friend at the whiteboard.** Conversational, a little
self-deprecating, always pointing at a physical thing. He says "look at this"
constantly. He is happy to admit something is confusing.

**Steven Strogatz — warmth.** Everyday analogies that survive contact with the
mathematics. He assumes you are smart and busy.

**Bartosz Ciechanowski — patience.** Never rushes. Lets a diagram do the talking.
Zero decoration. The standard for interactive explanation.

What they share: **plain words for big ideas, and respect for the reader.**

---

## Rules

**Say the thing.** No preamble, no throat-clearing.

**Concrete first.** A square you can turn, then the word "symmetry." Never the
reverse.

**One idea per sentence.** If it needs two commas and a dash, it's two sentences.

**Vary the length.** Short sentence. Then a longer one that carries the detail and
gives the reader somewhere to breathe. Then short again.

**Plain words.** *use* not *utilize*. *shows* not *demonstrates*. *about* not
*regarding*.

**Second person.** "You'll notice the diagonal is empty." Not "one observes."

**Bold is rare.** Once a section, maybe. It should mean *stop here*.

**Admit difficulty.** "This is confusing and here's why" beats pretending it
isn't. The learner already knows.

**No exclamation marks.** The idea carries the excitement or it doesn't.

**Cut the last sentence of most paragraphs.** It's usually a summary of what you
just said.

---

## Humor

The subject is funny. Nobody says so.

One group is `D₄` in half the literature and `D₈` in the other half. "Symmetry
group" and "symmetric group" mean different things. The largest sporadic simple
group is called the Monster, and its link to modular forms is called moonshine,
because the people who found it assumed someone had been drinking.

That's the material. It doesn't need jokes added.

```
NEVER funny        the mathematics itself. Wrong math isn't a joke.
ALWAYS honest      the humor comes from telling the truth about an absurd field.
NEVER cute         no puns, no mascot, no winking.
NEVER condescending a competent adult who hasn't met this is not a child.
```

Test: would this make a smart friend smile, or make a stuck learner feel
patronized? Only the first ships.

---

## Errors

Error messages are teaching. They are read at the worst moment, so they get the
most care.

```
✗  expected string at arrows.i.-k
✓  generator "i" has no arrow out of "-k" — every node needs one arrow
   of each color leaving it
```

Say what's wrong. Say what would be right. Use the words of the subject.

"Not a group **yet**" — the *yet* matters. It says: fixable.

---

## Checklist

Before anything ships:

```
□  read it out loud. Anywhere you stumble, rewrite.
□  count the em-dashes. More than one per paragraph, cut them.
□  count the bolds. More than one per section, cut them.
□  find "genuinely", "precisely", "worth noting". Delete.
□  is the first sentence the actual point, or a warm-up?
□  can any sentence lose half its words?
□  would a tired person at 11pm get this on one read?
```

That last one is the real test.
