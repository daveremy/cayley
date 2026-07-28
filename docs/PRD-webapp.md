# PRD — cayley on the web

**Status:** draft, for review
**Date:** 2026-07-28

---

## 1. What this is

A web application for learning group theory, built for **software developers who
are not mathematicians**.

Three surfaces over one engine:

```
TUTORIAL     a guided path. Lessons that make you DO things, not read things.
EXPLORER     a sandbox. Any group, any view, poke at it.
API / MCP    the engine as a service, for scripts and for agents.
```

## 2. Who it is for, and why that is unusually well-defined

The primary user is the author: a working software developer, not math-native,
currently learning group theory from Carter's *Visual Group Theory*.

That matters more than usual, because **his failures are logged with
timestamps.** [`learner-failure-log.md`](./learner-failure-log.md) — in this
repo, extracted from a running log kept during the learning — records every place
he got stuck over one week, what unstuck him, and whether it held:

| stuck point | cost |
|---|---|
| believed a group's elements were the square's **corners**, not its moves | 2 days |
| "order" means two unrelated things (group order vs element order) | 1 hour |
| `\|G\|` and `\|a\|` — same notation, different meanings | recurring |
| "symmetry group" vs "symmetric group" — one letter apart | recurring |
| notation anxiety at `∈` ("I want to cry") | resolved in 30 min by a decoder ring |
| ℚ vs ℤ — 3 sessions of repetition failed; one structural visual fixed it | 3 sessions |

**That is not a guess at what learners find hard. It is measured data on one real
learner.** The curriculum should be derived from it rather than from a textbook's
table of contents.

Secondary audience: anyone with a programming background meeting group theory —
via cryptography, graphics, puzzles, type theory, or curiosity.

## 3. The differentiator

Everything else in this space picks one register and stays there.

```
Group Explorer      superb visualization; assumes you have read the book
Carter's book       the best intuition-first text; static, math notation only
3Blue1Brown         beautiful, passive, you watch
Khan / OCW          lectures and problem sets; no code, no interactivity
```

**Nothing teaches group theory in code.** The gap is real, and this project has
already demonstrated the fix in miniature — the axiom checks in `group.ts` carry
their formal statement, their English reading, and their implementation:

```
∀x ∈ G, ∃y ∈ G :  xy = e            the notation
"for every x there EXISTS a y…"      the reading
g.elements.every(x =>                the code
  g.elements.some(y => t[x][y] === e))
```

`∀ → .every()`, `∃ → .some()`. That correspondence is close to mechanical, and a
developer who has never read a quantifier can read one immediately once shown.

**Three registers, one fact, always.** That is the product.

## 4. ⚑ The load-bearing principle

> **Everything displayed is COMPUTED from the engine. Nothing mathematical is
> ever authored by hand.**

Every table comes from `table(g)`. Every diagram from `arrows`. Every element
order from `order(g, x)`. Prose is authored; mathematics never is.

Four consequences, and they are the reason this is principle #1:

1. **The app cannot display false mathematics.** Content cannot drift from truth
   because content does not contain truth-claims — it contains references.
2. **Authoring a lesson is writing prose and choosing a group.** Not transcribing
   a multiplication table and hoping.
3. **A lesson written for C₄ works for C₅ for free.** Parameterise the group and
   the exercise regenerates.
4. **It is already proven.** Today's experiment: two frontier image models were
   asked for a cross-product diagram. Both drew the vectors at 150° with a
   right-angle marker between them. Neither noticed. The hand-written matplotlib
   version asserts `a · b == 0` and fails the build otherwise.

**Generated or hand-drawn assets are permitted only where being wrong cannot
teach something false** — decoration, illustration, mood. Never the mathematics.

## 5. Non-goals

- **Not a Group Explorer replacement.** GE is exhaustive and expert-facing. This
  is guided and beginner-facing. Different products; GE stays a cross-check.
- **No accounts, no database, no login.** Progress in `localStorage`, sharing via
  URL-encoded state (the Glyph pattern, already proven with this user).
- **Not a proof assistant.** No theorem proving, no Lean.
- **Not comprehensive.** It teaches a path through group theory, not all of it.
- **No AI chat tutor.** Tempting and wrong: the corrective protocol in this
  project exists *because* conversational tutoring hid absent competence behind
  fluent dialogue. Exercises with real feedback, not a chatbot.

## 6. Requirements

### 6.1 Stated

| | |
|---|---|
| **Free hosting** | Vercel free tier. No paid services in the critical path. |
| **Fast** | see budget below |
| **Beautiful** | see design direction below |
| **For developers / non-math-natives** | the three-register principle |

### 6.2 Performance budget — "fast" made falsifiable

```
LCP (lesson page)          < 1.0 s     on a mid-tier phone, 4G
Interaction to next paint  < 100 ms
JS shipped, content page   < 50 KB     gzipped
JS shipped, explorer       < 200 KB    gzipped
engine operations          < 1 ms      already true: table() is memoised
```

The engine is not the risk. **Framework weight is the risk.**

### 6.3 Design direction — "beautiful" made concrete

The lineage is Tufte and Carter, not SaaS landing page.

- **Typography first.** This is a project about notation anxiety; if the notation
  is not beautifully set, the product has failed at its own thesis.
- **Computed diagrams**, clean lines, no decoration that carries no information.
- **Restrained palette.** One accent. Generous whitespace.
- **Dark mode** — the primary user studies at night.
- No gradients, no hero images, no illustrations of abstract concepts.

### 6.3a Rendering strategy — and a contradiction in an earlier draft

**⚠ KaTeX versus the 50 KB budget (gemini, round 2).** An earlier draft required
KaTeX for notation *and* capped content-page JS at 50 KB. KaTeX is ~280 KB before
fonts. Those two requirements could not both be met.

**Resolution: render mathematics at BUILD time.** `remark-math` + `rehype-katex`
run during the Astro build and emit HTML plus MathML. Ship **zero** runtime JS
for notation, and get screen-reader support for free because MathML is semantic.

Runtime KaTeX is permitted only in the explorer, where a user types an expression
and it must render live — and that page has the 200 KB budget.

**Cayley diagrams: SVG, computed, laid out by known shape.**

```
format    inline SVG. crisp at any zoom, styleable by CSS, ARIA-labelable,
          a few KB of generator code. Not canvas, not WebGL — these groups
          are tiny and SVG is the accessible choice.

layout    BY SHAPE, not by physics. Cyclic → a ring. Dihedral → two concentric
          rings joined by rungs. Direct products → a grid. Carter hand-placed
          all 300+ of his figures for this reason: a force simulation produces
          a WORSE picture than fifty lines of "put the n rotations on a circle".
          A layout library (d3-force, elkjs) is only warranted for a group whose
          shape we do not know — which, so far, is none of them.

budget    diagram generator ≤ 15 KB gzipped. Layouts are trigonometry.
```

### 6.3b Offline and the group library

The six group files total a few KB. **Bundle them at build time** as a static
import rather than fetching — offline works with no service-worker complexity,
and there is no network round-trip on first paint.

A service worker is only needed to cache the app shell. Library growth past a few
dozen groups would change this (issue #9), not before.

### 6.4 ⚑ Requirements NOT stated, that I would add

**Accessibility, and one part of it is urgent.** Cayley diagrams encode
generators *by colour* — and this project has been using **red and green**, which
is the single worst pair for the commonest colourblindness. Colour must never be
the only channel: line style, labels and shape must carry it too. Plus MathML via
KaTeX so notation is screen-readable, and full keyboard navigation.

**Mobile.** The primary user reads Carter in bed and photographs pages with his
phone. A tutorial unusable on a phone is unusable at the moment he actually
studies.

**Offline.** A learning tool should work on a plane. Static assets plus a service
worker; there is no server-side state to lose.

**Shareable state in the URL.** Proven with Glyph. "Here is the exact diagram I
am confused about" should be one link.

**No dead ends.** When a learner is wrong, the app must say *why*, in the
vocabulary of the subject. `cayley check` already does this:

```
✗ generator "i" has no arrow out of "-k" — every node needs one arrow of
  each colour leaving it
```

versus what a generic validator would say: *"expected string at arrows.i.-k"*.
True and useless. **The error message is the teaching moment.**

**Pedagogy constraints, empirically derived from this project's own failures:**

- **Exercises are the work.** Reading is preparation. Pace = the rate the learner
  does problems cold.
- **Predict before reveal.** Commit to an answer, then check.
- **No leading questions.** A prompt that contains its answer measures nothing.
- **"I don't know" is a first-class answer** and must be explicitly invited.
- **Recognition ≠ mastery.** Progress is recorded from unscaffolded production
  only. This project logged a month of false progress by recording the former as
  the latter.
- **Label domain toll.** Learning quaternion algebra to author Q₈ is *not*
  learning group theory. A learner who cannot tell the difference will believe
  they are failing at group theory when they are failing at quaternions.

### 6.5 Progress state — schema and migration

`localStorage`, versioned from day one, because lesson content will change and
stale progress must not silently corrupt.

```ts
type Progress = {
  version: 1;
  lessons: Record<LessonId, {
    completedAt: string;      // ISO
    attempts: number;
    firstTry: boolean;        // ← the honest signal
    saidIDontKnow: number;    // NOT a penalty. Data.
  }>;
  lastLesson: LessonId | null;
};
```

**Migration policy:** on a version bump, keep completions, discard attempt
statistics. On an unknown `LessonId`, drop that entry silently. Never block the
app on unreadable state — clear it and continue.

`firstTry` is the field that matters. Given this project's history of recording
recognition as mastery, **"completed" alone is not evidence.**

### 6.6 Exercise taxonomy — the mechanics of DO

Section 8 named the lesson shape but not the interactions. Concretely:

| type | the learner does | example |
|---|---|---|
| **predict** | commits an answer before any reveal | "how many symmetries does a square have?" |
| **fill a cell** | completes part of a multiplication table | one cell, then a row, then the grid |
| **walk a path** | clicks arrows to travel the diagram | "get from `i` to `−k`" |
| **pick the element** | selects from the element list | "which one is the identity?" |
| **classify** | judges a property | "is this abelian? is it even a group?" |
| **spot the difference** | compares two groups | C₄ vs V₄ — what separates them? |
| **author** | fills in arrows, validator grades | Q₈ — advanced, optional |

**"I don't know" is a button on every exercise.** It is not a penalty and never
counts as failure. It reveals a *structural hint* — a different representation,
not the answer — logs `saidIDontKnow`, and offers the exercise again later.

That behaviour is load-bearing. This project's biggest teaching failure was a
learner unable to say he was lost, because the surrounding praise made it
expensive. **The button removes the social cost.**

**The tutorial may never get ahead of the author.** Lesson *N* covers only
material earned through exercises. This paces the project honestly and prevents
it sprawling into a GE clone.

## 7. Architecture

### 7.1 Layering — mostly built, with one real seam missing

```
        group.ts        pure math, ZERO imports          ← runs in a browser today
           ↑
        errors.ts       typed failures                   ← browser-ready
           ↑
        load.ts         files → validated groups         ← node:fs, node:path
           ↑
      commands.ts       input → data, no printing        ← ⚠ see below
           ↑
     ┌─────┴──────┬──────────────┐
   cli.ts       web             api/mcp
   (built)     (this)          (issue #10)
```

`commands.ts` was written for exactly this. Its return shapes **are** the
`--json` output and therefore the API response bodies, and a test asserts it
never writes to stdout.

### ⚠ 7.1a The browser seam — a real M0 task, not a footnote

**`commands.ts` is not importable in a browser as it stands**, and an earlier
draft of this PRD claimed otherwise. The check that produced that claim was
shallow: it grepped for direct `node:` imports and did not follow the graph.

```
commands.ts  →  load.ts  →  node:fs, node:path
```

A client bundle importing `commands.ts` drags Node built-ins in transitively.
Depending on the bundler that is either a build failure or, worse, a shim that
fails at runtime.

**Three ways to cut the seam, in preference order:**

1. **Inject the library.** `commands.ts` takes `Group[]` (or a small
   `GroupSource` interface) as a parameter instead of importing `loadLibrary`.
   Purest, testable, no bundler configuration. Touches every command signature.
2. **Split the module.** `load.ts` keeps `validate()` (pure, browser-safe) and a
   new `load.node.ts` holds the filesystem parts. `commands.ts` imports only the
   pure half.
3. **Bundler alias.** Point `./load.ts` at a browser implementation in the Vite
   config. Least code, but the coupling becomes invisible and build-tool-specific.

Option 1 or 2. **This must be resolved in M0 before any lesson work** — it is a
signature change across the command surface and gets more expensive later.

Once cut, the browser needs a `loadLibrary` equivalent: the group files are
static JSON, so a bundled import or a `fetch` of a prebuilt index. `validate()`
runs unchanged in either environment.

### 7.2 Framework — recommendation with the trade-off shown

| | ships JS | content authoring | app-like views | verdict |
|---|---|---|---|---|
| **Astro** | ~0 by default, islands | MDX, excellent | islands | **recommended** |
| Next.js | heavier baseline | MDX, good | native | Vercel-native but heavy |
| SvelteKit | very small | good | native | fine; another ecosystem |
| Vite + vanilla | smallest | manual | manual | fastest, poorest authoring |

**Astro**, because the tutorial is mostly *content* with interactive islands, and
Astro ships near-zero JS on content pages — which is the performance budget's
main lever. The explorer becomes one heavier island or route.

Two risks to check early, both in M0:
- cayley's imports use explicit `.ts` extensions (Node strip-types style). Vite
  handles this, but verify before committing.
- the browser seam in 7.1a. Do not start lessons until it is cut.

### 7.3 Repo

Same repo, `web/` directory. The engine coupling is tight and version skew
between a separate repo and the engine would be a recurring tax. Vercel deploys
a subdirectory natively.

### 7.4 API and MCP (issue #10)

Vercel serverless functions wrapping `commands.ts`. Error mapping already exists:
`UnknownGroupError → 404`, `UsageError → 400`, `GroupValidationError → 422`.

**MCP timing is fortunate:** the spec went stateless on 2026-07-28 — removing the
session handshake — which is exactly what makes serverless MCP hosting practical.

The most novel tool is the **validator**: an agent can author a group and be told,
in group-theory language, precisely why it is not one.

**Endpoints:**

```
GET  /api/v1/groups                    the library
GET  /api/v1/groups/:name              show
GET  /api/v1/groups/:name/table        the multiplication table
GET  /api/v1/groups/:name/arrows       the diagram as data
GET  /api/v1/groups/:name/mul?x=&y=    one product, with the path walked
POST /api/v1/validate                  is this JSON a group? ← the novel one
POST /api/mcp                          stateless MCP transport
```

**Free-tier protection (gemini, round 2).** Vercel's hobby tier has finite
invocations and a short function timeout, and an unauthenticated public API is
the obvious way to exhaust both.

```
cache hard          every GET is deterministic and immutable. s-maxage=31536000,
                    stale-while-revalidate. The CDN should serve nearly all of it
                    and functions should almost never run.
prefer static       generate the whole library as static JSON at build time. The
                    only genuinely dynamic endpoint is POST /validate.
rate limit          edge middleware, per-IP, on the POST routes only.
bound the input     POST /validate caps element count and payload size. The
                    validator is O(n³) — an adversarial 500-element "group" is a
                    denial-of-service with a 10-second function timeout.
```

That last one is a real vulnerability, not a hypothetical: `isAssociative` is a
triple loop and the timeout is short.

## 8. Content strategy — the actual hard part

**Lessons are the product. Code is scaffolding.** Most educational projects die
having built a platform and no curriculum.

Sequence derived from the failure log, not from a textbook:

```
 1  elements are MOVES, not the things being moved      ← the 2-day error
 2  the arrows ARE the operation                        ← 5 facts → 25 cells
 3  words: every element is a path from the identity    ← Carter Def 4.1
 4  multiply = walk y's path, starting from x
 5  the four axioms, as running checks                  ← ∀/∃ ↔ every/some
 6  "order" means two different things                  ← the 1-hour error
 7  same size ≠ same group                              ← C₄ vs V₄
 8  order matters: non-abelian                          ← D₄, Q₈
 9  subgroups and cosets as a tiling                    ← Lagrange, seen
10  families: learn a pattern, know infinitely many     ← needs issue #2
```

**Lesson anatomy**, from what has demonstrably worked with this user:

```
HOOK        a concrete object, usually a shape you can manipulate
PROBE       predict before reveal. Commit, then check.
DO          the exercise. This is the lesson; everything else is setup.
FEEDBACK    domain-language, never "incorrect"
THREE WAYS  picture · notation · code — the same fact, three registers
PARK        name what is interesting and deliberately deferred
```

## 9. Milestones

Each independently shippable.

| | | proves |
|---|---|---|
| **M0** | browser seam cut (7.1a), engine in a browser, deployed, one page | the pipeline works |
| **M1** | lesson 1 end to end | the lesson format works on its author |
| **M2** | lessons 1–5 + progress + sharing | it is a tutorial |
| **M3** | explorer mode | it is a tool |
| **M4** | public API | it is a service |
| **M5** | MCP server | agents can use it |
| **M6** | families + generated exercises | it scales past hand-authoring |

M1 is the real gate. **If lesson 1 does not work on the author, stop.**

## 10. Risks

| risk | mitigation |
|---|---|
| **content is the bottleneck** | M1 gates everything; do not build M2 until lesson 1 lands |
| **building instead of learning** | the tutorial may not get ahead of the author |
| **scope: two products in one** | tutorial ships first; explorer is M3, not M1 |
| **framework bloat kills "fast"** | measure the budget in M0, not at the end |
| **hidden Node deps in the engine** | 7.1a — cut the seam in M0, before it is expensive |
| **beautiful is subjective** | typography and computed diagrams are objective proxies |
| **red/green diagrams exclude readers** | colour never the sole channel, from day one |

## 11. Open questions

1. ~~**Astro or something smaller?**~~ **Resolved — Astro.** Both reviewers
   independently agreed: SSG keeps lesson pages under budget, and islands handle
   the interactive components. The explorer becomes one heavier route.
2. ~~**How much of the CLI should the web mirror?**~~ **Resolved — not parity.**
   The web surfaces `show`, `table`, `arrows`, `mul` and `diff` as interactive
   views. `check` and `list` are CLI-shaped. The API exposes everything.
3. ~~**Does the explorer need diagram rendering?**~~ **Resolved — yes.** Diagrams
   are the visual thesis; a table-only explorer undersells it. See 6.3a.
4. ~~**Lessons as data or code?**~~ **Resolved — MDX with typed components.**
   Prose stays readable, interactive widgets stay typed. Revisit if lessons ever
   need to be authored by non-programmers or generated.
5. **Is there a second user?** Everything here optimises for one known learner.
   That is a strength for M1 and a risk by M4.
6. **Licence stays MIT** — confirmed — but do hosted API terms need anything
   beyond that?
