# Contributing

There are three kinds of contribution here and they have deliberately different
bars. Groups are wide open. Code is a normal pull request. Lessons are closed for
now, for a reason given below.

---

## Setup

```bash
git clone https://github.com/daveremy/cayley && cd cayley
npm link                     # puts cayley on your PATH
npm test                     # the whole suite, in seconds
npm run g -- --help          # the CLI, without installing it
```

Node 25+. Zero dependencies, so there is nothing to install and no lockfile to
resolve. No build step — the TypeScript is stripped at run time, not compiled.
No account, no API key, no token, no local database. The only thing in this
project that needs credentials is deploying it, and you do not need to deploy it
to change it.

---

## Groups: welcome

**The validator is the review.** A group file is either a group or it is not, and
five phases of checking decide that in about a millisecond. Human review does not
improve on the mathematics, so the mathematics does not gate the merge.

```bash
cp groups/c5.group.json groups/drafts/mine.group.json
$EDITOR groups/drafts/mine.group.json
npm run check groups/drafts/mine.group.json
```

Start from an existing file rather than a blank one — the shape is small but the
labelling law in phase 3 is easy to get wrong from scratch. Clear `source` and
`notes` early; you have just inherited C₅'s, and they are the two fields nothing
will catch for you. Edit, run `check`, read what it objects to, edit again.
Repeat until it stops complaining. Then move the file into `groups/` and the test
suite adopts it automatically.

`groups/drafts/` is never loaded and never trusted. Work there for as long as you
like; nothing sees it until you move it.

The failure output is the point. It is written in the vocabulary of the subject,
not the vocabulary of JSON:

```
✗ mine.group.json — not a group yet. 1 problem(s):

  [phase 3] generator "a" has no arrow out of "a2" —
            every node needs one arrow of each colour leaving it
```

The five phases and what each one catches are documented in the
[README](README.md#adding-a-group). Worth reading once before your first file,
particularly the note on the labelling law — it is the one check that looks
redundant and is not.

**Four fields the validator cannot check for you**, and which a human therefore
reviews. Phase 2 checks the *type* of each. Nothing checks whether what they say
is true:

| field | why a person has to look |
|---|---|
| `source` | Where the group came from. Expected on every submission, though the schema does not enforce it — which is exactly why someone has to ask. Provenance is not derivable. |
| `notes` | Free prose, and it is displayed. The mathematics around it is verified; the sentences are not. |
| `name` | Phase 2 checks that it is a non-empty string. Nothing checks that a group labelled `S₃` is S₃. |
| `aliases` | Phase 2 checks it is an array of strings. Nothing checks that any of them names *this* group — so a valid group can pass all five phases under somebody else's name. |

Everything computed is guaranteed. Everything written is only as good as the
writer. If your `notes` make a mathematical claim, make it one the tool could
check.

Open a pull request with the `check` output pasted in. That is the whole process.

---

## Bugs and code: ordinary pull requests

Nothing unusual. Some things worth knowing before you start:

- **`npm test` must stay green.** CI runs it on every push, including yours.
- **The layers are worth respecting.** `src/group.ts` is the mathematics and
  imports nothing. `src/commands.ts` returns data and never prints. `src/cli.ts`
  prints and contains no mathematics. A fix that puts a calculation in the
  presentation layer will be asked to move. There is one deliberate exception,
  `printTable` in `group.ts`, which exists to eyeball a computed table against a
  hand-built one and says so in its comment; it is not a precedent.
- **The long comments in `src/` are load-bearing.** They carry formal statements,
  their English readings, and notes on why a check exists. A forty-line comment
  above a three-line function is not an oversight. Do not tidy them.
- **Commit messages explain WHY.** The message is the design record — it is the
  only place the reasoning survives. `fix bug` tells a future reader nothing they
  could not get from the diff.

If you are fixing something you found as a learner, say so in the issue. Where
people get stuck is data, and this project keeps a record of it.

---

## Lessons: by invitation, for now

The tutorial cannot get ahead of the person learning from it. It is being written
one step behind an actual beginner working through actual confusion, and
[`docs/learner-failure-log.md`](docs/learner-failure-log.md) is the record of
where that went wrong — including two days lost to believing a group's elements
were the corners of a square rather than the moves.

That constraint does not survive open contribution. Ten lesson PRs would produce
a curriculum built from a table of contents, which is the thing this is trying
not to be.

This is a "for now", not a policy. Once the format has proven it works on someone
other than its author, it opens.

**In the meantime, the most useful thing you can send is a confusion.** Open a
[lesson feedback issue](https://github.com/daveremy/cayley/issues/new?template=lesson_feedback.md)
saying what lost you and exactly where. That is a direct contribution to the
lessons, and currently a more valuable one than prose.

---

## Two licences

Code is **MIT**. Content — lesson prose, diagrams, the failure log — is
**CC BY 4.0**. See [`LICENSE`](LICENSE) and
[`LICENSE-CONTENT`](LICENSE-CONTENT). By contributing you agree your work goes
out under whichever of the two applies to it. Group files are code.

Everyone here is expected to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).
