---
name: New group submission
about: Propose a group for the library
title: 'group: '
labels: library
assignees: ''
---

**Which group, and why it is worth having**

Name, order, and what it is a group *of*. Groups that illustrate something the
library cannot currently show are the most useful — a smallest example, a
counterexample, or a pair that are the same size and not the same group.

**Checklist**

- [ ] `npm run check <file>` passes. Paste the output below.
- [ ] The file lives in `groups/`, not `groups/drafts/`.
- [ ] `source` is filled in — where the group came from, or how it was derived.
- [ ] `notes` is accurate. It is displayed, and it is prose, so nothing verifies
      it but a reader. If it makes a mathematical claim, make it a checkable one.
- [ ] `name` and `aliases` use the notation people will actually search for.
      D₄ and D₈ both refer to the symmetries of a square depending on which half
      of the literature you read; list both if it applies.

**`check` output**

```
$ npm run check groups/<yours>.group.json

```

---

The validator is the review — if the five phases pass, the mathematics is sound.
What is left for a reviewer is everything the phases cannot see: `source`,
`notes`, and whether the group is called what it says it is. A valid group file
mislabelled `S₃` passes all five.
See [CONTRIBUTING.md](../../CONTRIBUTING.md#groups-welcome).
