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

## 4a. ⚑ The second principle: context boundaries

Borrowed from domain-driven design, and it is the same problem. **Two bounded
contexts are in play at all times, and confusing them is the single most common
source of pain in this project's failure log.**

```
DOMAIN CONTEXT                      GROUP THEORY CONTEXT
────────────────────────────────    ──────────────────────────────────
quaternions · squares · pentagons   elements · generators · words
i, j, k  /  rotations  /  corners   e, a, a²  /  ij, ji
i² = −1 because Hamilton said so    order, inverse, subgroup, coset
"what does k mean?"                 "what is its order?"
              │                                   │
              └────────── translation ────────────┘
                        THE EXTRACTION
```

### 4a.1 Every group declares its domain

Currently domain provenance lives in free-text `notes`. It should be structured
so the app can *say* which context a fact belongs to:

```json
"domain": {
  "name": "quaternions",
  "field": "hypercomplex number systems",
  "origin": "Hamilton, 1843",
  "elementsAre": "the eight unit quaternions",
  "operationIs": "quaternion multiplication",
  "tollNotes": "i²=j²=k²=−1 is Hamilton's definition, not derivable here"
}
```

That last field is the important one. **A learner who cannot distinguish domain
toll from subject matter will believe they are failing at group theory when they
are failing at quaternions** — which happened, and had to be asked about.

### 4a.2 Labels are a view, switchable at will

The same group carries several label registers, and each hides what the others
show:

```
DOMAIN LABELS     1, i, j, k, −1, −i, −j, −k
                  meaning visible · movement invisible
                  "k" tells you nothing about how to reach k

PATH LABELS       (e), i, j, ij, ii, iii, iij, ji
                  movement visible · meaning invisible
                  k = ij and −k = ji — NON-COMMUTATIVITY, readable off the labels
                  Carter Definition 4.1

INDEX LABELS      0..n−1
                  neither · useful only for comparing structure across groups
```

C₅ gets meaning and movement in one register for free — `a³` is simultaneously a
name and a path — which is exactly why it felt easy. **Q₈ cannot**, because its
names come from a number system that predates the diagram by a century.

**Do the work in path labels; translate back at the boundary.** That is the
proposal, and it is how applied mathematics actually runs: model, compute in the
abstraction, interpret the result back into the domain.

⚠ One caveat: path labels do not compose by concatenation. `ij` followed by `i`
is not `iji` in canonical form — reducing it needs the group's relations, and in
general that is the *word problem*, which is undecidable. **The engine therefore
walks arrows rather than manipulating strings**; labels stay a display concern.

### 4a.3 Terminology is tagged by context

Every term the tutorial introduces is marked with where it comes from. The
recurring traps stop being ambient and become visible boundary crossings:

| term | context | trap |
|---|---|---|
| "symmetry group" | description | a *phrase*, not a family name |
| "symmetric group Sₙ" | group theory | a *named family*. One letter apart. |
| `\|G\|` | group theory | how many elements |
| `\|a\|` | group theory | an element's order. Same bars. |
| `i² = −1` | domain (Hamilton) | decreed, not derived |
| `×` | four contexts | Cartesian, cross, direct product, multiplication |

## 5. Non-goals

- **Not a Group Explorer replacement.** GE is exhaustive and expert-facing. This
  is guided and beginner-facing. Different products; GE stays a cross-check.
- **No accounts, no database, no login — through M3.** Progress in `localStorage`,
  sharing via URL-encoded state (the Glyph pattern, already proven with this
  user). **This is a deferral with named triggers, not a permanent position** —
  see §11.7.
- **Not a proof assistant.** No theorem proving, no Lean.
- **Not comprehensive.** It teaches a path through group theory, not all of it.
- **No AI chat tutor.** Tempting and wrong: the corrective protocol in this
  project exists *because* conversational tutoring hid absent competence behind
  fluent dialogue. Exercises with real feedback, not a chatbot.

## 6. Requirements

### 6.1 Stated

| | |
|---|---|
| **Free hosting** | Cloudflare Pages + Workers — see §7.5. No paid services in the critical path. |
| **Fast** | see budget below |
| **Beautiful** | see design direction below |
| **For developers / non-math-natives** | the three-register principle |

### 6.2 Performance budget — "fast" made falsifiable

```
LCP (lesson page)          < 1.0 s      on a mid-tier phone, 4G
Interaction to next paint  < 100 ms
JS shipped, content page   < 50 KB      gzipped
JS shipped, explorer       < 200 KB     gzipped
engine operations          < 1 ms       already true: table() is memoised

All bundle figures are GZIPPED transfer size. KaTeX at ~280 KB (§6.3a) is
uncompressed library size and is the reason it renders at build time, not at
runtime — it would not fit either budget.
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
static JSON, so a bundled import or a `fetch` of a prebuilt index.

**Which functions cross, precisely:**

```
validate(data: unknown)   PURE BEHAVIOUR. all five phases, no filesystem.
                          ⚠ but see below — its current MODULE is not.
loadGroup(path)           NODE ONLY. takes a file path.
loadLibrary(dir)          NODE ONLY. reads a directory.
check(path)               NODE/CLI ONLY — wraps loadGroup. The browser
                          equivalent is validate() on already-parsed JSON.
```

The web never has a path; it has parsed objects. `validate()` is the whole
surface it needs.

**⚠ And this is exactly where an implementer would still get it wrong** (codex,
round 5). `validate` is *pure in behaviour* but is **currently exported from
`load.ts`**, whose top-level `node:fs` and `node:path` imports are the very seam
this section exists to cut. Import it from there and the browser build pulls in
Node built-ins anyway — the function being pure does not help when the module
is not.

**So cutting the seam means physically moving it.** Target layout:

```
src/validate.ts    NEW. validate() and its five phases. Zero imports beyond
                   group.ts and errors.ts. This is what the web imports.
src/load.ts        keeps ONLY the filesystem parts — loadGroup, loadLibrary,
                   the cache — and imports validate.ts.
```

Purity is a property of the import graph, not of the function body. That
distinction is the whole content of this section, and it is easy to lose.

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
between a separate repo and the engine would be a recurring tax. Cloudflare Pages
builds from a subdirectory natively.

### 7.4 API and MCP (issue #10)

Edge functions wrapping `commands.ts`. Error mapping already exists:
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

#### Who actually uses this — the consumers the endpoints exist for

An API without named consumers is a spec, not a decision. Five, in rough order of
how much they justify the work:

```
1. THE APP ITSELF          the web front end is consumer zero. If the API is not
                           good enough for our own explorer, it is not good.

2. AN AGENT CHECKING A     "is this set of moves a group?" An LLM asked a group-
   CLAIM (the novel one)   theoretic question can VERIFY instead of guessing.
                           POST /validate returns failures in group-theory
                           language: "generators [i,j] do not reach [-k]".
                           Nothing else on the internet does this.

3. A LEARNER'S SCRIPT      checking homework, generating practice, sanity-
                           checking a hand-built table. curl and jq.

4. ANOTHER TEACHING TOOL   embedding group data. Everything is deterministic and
                           cacheable, so this costs us nothing.

5. NOTEBOOK / REPL         exploratory use from Python or JS without installing
                           anything.
```

**Consumer 2 is the one that makes MCP worth building.** An agent that can *check*
a group-theoretic claim rather than produce plausible text about it is a genuinely
different capability — and it is the same argument as this project's own
"computed, not drawn" principle, applied to reasoning instead of pictures.

**MCP tools**, one per command, plus:

```
validate_group    author a group, get told precisely why it is not one
compare_groups    are these two the same? which invariant separates them?
```

#### Free-tier protection

An unauthenticated public API is the obvious way to exhaust any free tier.

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
triple loop, and Cloudflare's free tier allows **10 ms of CPU per invocation**.
Order 24 is ~14k comparisons and fine; order 168 is 4.7M and is not. The cap is
not politeness, it is the difference between working and not.

### 7.5 Hosting — Cloudflare, not Vercel

The PRD originally said Vercel because that is what was asked for. Researching it
properly reverses the recommendation:

| | Vercel Hobby | Cloudflare Pages + Workers |
|---|---|---|
| static bandwidth | ~100 GB/mo included | unmetered for static assets |
| exceeding included usage | **deployment paused** | n/a for static |
| requests | 1M/mo | 100k/**day**, static excluded |
| commercial use | **prohibited on Hobby** | permitted |
| CPU per request | generous | **10 ms free tier** ← the real constraint |

*(Free-tier terms change. Verify against provider docs before relying on any row.)*

**Two things decide it, and one turned out to be the opposite of what I assumed:**

1. **Exceeding included Hobby usage pauses the deployment.** For a public
   educational site whose entire purpose is being read, one good day on Hacker
   News taking it offline is a bad failure mode. Cloudflare's static assets are
   unmetered and do not count toward the request limit, which is exactly the
   shape this site has.
2. **⚑ Cloudflare is already the estate's DNS layer** (Karpathy, 2026-07-28).
   neuralingual.com, daveremy.com and innerstacklabs.com all resolve to
   Cloudflare nameservers. **This is not adding a fourth provider — it is using
   more of an existing one**, and it is therefore the option with the *lowest*
   integration tax, not the highest: DNS record and origin end up in the same
   dashboard, instead of the cross-provider hop already lived with on
   Neuralingual.

*Not* deciding it: cold-start comparisons. Vercel Edge Functions and Cloudflare
Workers are both V8-isolate based, so that difference is far less decisive than
the bandwidth and commercial-use terms. An earlier draft overstated it.

Vercel Hobby's non-commercial restriction is a documented platform term; whether
it constrains sponsorship on an open-source project is a judgement, not a settled
fact — but it is a latent trap either way.

**The cost:** 10 ms CPU per invocation on the free tier. That constrains
`POST /validate`, which we were bounding anyway for denial-of-service reasons —
constraint and mitigation coincide. Escape hatch if it ever binds: Workers Paid
(~$5/mo, 30 s CPU), which is strictly better than a site that pauses.

Astro has a first-class Cloudflare adapter; nothing else in the plan changes.

#### ⚠ 7.5a Credential scope — a hard requirement

**Use a project-scoped Cloudflare API token. Never the account-wide credential.**

That account controls DNS for **neuralingual.com** — a live business. A mistake
in this project's tooling must not be able to touch production DNS. Blast-radius
containment is the single most important operational constraint here.

```
scoped token       Pages:Edit + Workers:Edit on THIS project only
stored             1Password
never              the account-wide "Inner Stack Labs — Cloudflare" credential
```

**Open, and not mine to settle:** cayley is personal open source under
`github.com/daveremy`, while the existing Cloudflare item lives in the Inner
Stack Labs vault. Whether this runs under the business account at all is a
question of IP and accounting cleanliness — Dave's call.

**Two ops costs to absorb at deploy time:** `wrangler` is not installed anywhere
yet and joins the CLI-update watch list; Cloudflare Pages/Workers becomes a new
monitoring surface. Loop Moss in when it actually deploys, not before.

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

## 11. Success, licensing, and the things that make it a project

### 11.1 How we would know it worked

Ordered by how much they actually mean:

```
M1  the author works lesson 1 cold and it lands            ← the only gate
M2  he finishes lessons 2–5 without being talked through them
M3  he reaches for the explorer instead of the CLI
M4  something other than our own front end calls the API
M5  an agent uses the validator to check a claim it would otherwise guess at
M6  the family generator produces a group nobody hand-authored
──  a second person completes lesson 1                     ← not tied to a milestone
```

**`firstTry` is the honest metric.** "Completed" is not evidence — this project
logged a week of recognition as mastery before the learner said so out loud.

**How it is observed, given §11.2 says no analytics.** Through M3 the entire user
base is the author, and evaluation is *manual*: his `localStorage` is inspectable,
and an export button dumps it as JSON. No collection, no transmission, no
third party. That is sufficient for a sample size of one and stops being
sufficient the moment there is a second user — at which point §11.2 must be
revisited deliberately rather than drifted past.

### 11.2 Analytics

**None by default.** No third-party scripts, no cookies, no fingerprinting. It
conflicts with the performance budget, the offline requirement, and the audience.

If completion data is ever wanted: self-hosted, aggregate, opt-in, and it must
never be the reason a page ships JavaScript.

### 11.3 Licensing — two licences, deliberately

```
code      MIT            already in place
content   CC BY 4.0      lesson prose, diagrams, the failure log
```

Separating them is standard for a project that is both software and writing, and
CC BY means the lessons can be reused by other educators with attribution — which
is the point of writing them.

### 11.3a ⚑ Prose accuracy — the gap in our own principle

§4 says all mathematics is computed and therefore cannot be wrong. **That
guarantee does not extend to the sentences around it** (codex review), and the
explanation is most of a lesson.

A page can render a correct table under a paragraph that misexplains it. The
engine will not notice.

```
computed        tables, diagrams, orders, words, every property     ← verified
authored        every sentence of explanation                        ← NOT verified
```

**Required process before any lesson ships:**

1. **Every mathematical claim in prose gets a runnable counterpart.** If the text
   says "V₄ has no element of order 4", a test asserts it. Claims that cannot be
   made runnable are rewritten until they can be.
2. **External review of the mathematics**, not just the code. Same discipline
   already applied to plans and diffs.
3. **Corrections are visible.** A dated errata note, not a silent edit — this
   project has already recorded and had to retract a "resolved" claim about a
   learner's understanding.

### 11.3b Contributed groups — moderation and abuse

Groups are welcome contributions (§11.4) and are also arbitrary user input.

```
the validator IS the review     five phases; a non-group cannot merge
but CI must run it              a contributed file that skips validation is
                                an unreviewed assertion in a trusted library
size bound                      isAssociative is O(n³) against a 10 ms CPU
                                ceiling. Cap element count in CI and in the API.
prose fields                    notes/aliases are free text and are DISPLAYED.
                                Sanitise. Review by a human before merge.
attribution                     source field required, so provenance is not lost
```

### 11.3c API versioning and terms

Paths are already `/api/v1/...`. The policy that makes that mean something:

```
additive changes    new fields, new endpoints — no version bump
breaking changes    new version path. v1 keeps working.
deprecation         announced in the repo, minimum 6 months, Deprecation header
terms               "no warranty, no uptime guarantee, be reasonable." A free
                    educational API needs one short honest paragraph, not an EULA.
```

### 11.3d Self-hostable — a requirement, not a nicety

The content is CC BY 4.0 (§11.3). **Content that cannot be rehosted is not
meaningfully open.**

```
build target        pure static HTML/CSS/JS. Deployable to GitHub Pages,
                    Netlify, S3, or a laptop.
Cloudflare-specific ONLY the API and MCP Workers. Not the site.
POST /validate      configurable API base URL. Degrades gracefully when absent —
                    the tutorial and explorer work without it, because the
                    engine runs client-side anyway.
```

A fork should be able to `npm run build` and serve the result from anywhere.

### 11.3e Local development without a Cloudflare account

An external contributor must not need an account, a token, or a paid anything to
build and test.

```
astro dev           the whole site. no cloud dependency.
wrangler dev        local mode, for the API only. optional.
npm test            196 tests. no network.
cayley <cmd>        the CLI. no network.
```

**Only deploying needs credentials.** Everything else runs offline, and that must
stay true — the moment contribution requires an account, contribution stops.

### 11.3f Lesson prose verification in CI

§11.3a requires every mathematical claim in prose to have a runnable counterpart.
That is worthless unless it is enforced:

```
1. lesson MDX declares its claims in frontmatter:

   claims:
     - "V₄ has no element of order 4":  orderProfile(V4)[4] === undefined
     - "Q₈ and D₄ are not isomorphic":  diff('Q8','D4').distinguishedBy.length > 0

2. CI extracts and RUNS them against the engine
3. a lesson PR cannot merge with a failing or absent claim check
```

Prose without a runnable claim is not forbidden — plenty of sentences are not
mathematical. **But a sentence that asserts a mathematical fact and cannot be
made runnable gets rewritten until it can be.**

### 11.3g Interactive component failure states

Islands can be handed malformed input — a corrupted `localStorage` blob, a
hand-edited URL, a group that fails validation.

```
never            a blank page or a stack trace
always           the domain-language error, the same as `cayley check`
degradation      an island that fails leaves the static prose readable
recovery         "reset this exercise" is always available
```

The no-dead-ends rule (§6.4) applies to broken software as well as wrong answers.

### 11.4 Contribution model

Open source from day one, but the tutorial is not a wiki. Three tiers:

```
GROUPS      welcome. A .group.json file plus `cayley check` passing is the whole
            bar. The validator IS the review.
BUGS/CODE   normal PRs.
LESSONS     by invitation, at least until the format is proven. The tutorial may
            not get ahead of its author, and that constraint does not survive
            open lesson contribution.
```

### 11.5 Browser support

Last two versions of Chrome, Firefox, Safari, Edge, plus iOS Safari — the primary
user reads on a phone. No IE, no polyfill budget. Graceful degradation: **lesson
prose must be readable with JavaScript disabled**, since it is static HTML anyway.

### 11.6 Explicit non-goals, added

- **No internationalisation.** English only. Notation is already universal.
- **No video.** 3Blue1Brown exists and is better at it.
- **No user-generated lessons** (see 11.4).

### 11.7 Identity — deferred, not refused

The non-goal above is scoped to M0–M3. Three futures would warrant revisiting,
and the architecture should not preclude any of them.

```
TRIGGER                              CHEAPEST ANSWER
cross-device progress gets annoying  1. URL save-links (already proven)
                                     2. SYNC CODE — 6 chars → KV blob.
                                        no email, no password, no PII.
                                     3. real auth, only if 1 and 2 fail

public API gets abused               keys in KV. additive: a header, not a redesign.

MCP consumers need identity          OAuth 2.1, per the 2026-07-28 stateless spec
```

**Cross-device is the one likely to bite first**, and it is about the actual
primary user: he reads Carter in bed on a phone and works at a desk.
`localStorage` does not follow him between them.

**The sync-code option deserves naming now** because it is much cheaper than auth
and solves the real problem: a code mapping to a progress blob in Cloudflare KV,
typed once on the other device. No email, no password, no account.

**⚠ Under-specified, and two successive drafts each got it wrong.**

Codex noted six characters is brute-forceable. The fix attempted — *"≥128 bits of
entropy"* — then contradicted the entire point: 128 bits is a 32-character string,
and nobody types that on a phone in bed. **Security requirement and UX
requirement in direct opposition.**

The resolution is the one every device-pairing flow already uses. **Entropy does
not have to come from the code; it can come from the time window and the attempt
limit:**

```
short code          6 digits — typable, one-handed, on a phone
short TTL           5 minutes, then it is dead
attempt limit       3 redemptions, then revoked
rate limited        per-IP on the redemption endpoint
```

One million combinations against three attempts inside five minutes is not
brute-forceable in any practical sense. **It is a pairing code, not a password**,
and the distinction is what makes it both safe and usable.

```
retention      state a deletion policy up front. Data with no expiry is a
               liability that accrues silently.
```

And **"no GDPR surface" was too strong.** Progress data identifies learning
behaviour over time and can be personal data even without a name attached. The
honest claim is *minimal* personal data, not none — and a one-paragraph privacy
note is required if this ships, not optional.

**Note the cost argument weakened.** "No database" was partly about free tiers —
but Cloudflare's free tier includes KV and D1, so a minimal identity layer is
free-tier-compatible on the platform we chose.

**What to preserve now so this stays cheap:**

- the progress schema (§6.5) is already a serialisable blob — it can be stored
  remotely without reshaping
- API endpoints stay additive: an `Authorization` header can be introduced
  without changing any response body
- **no user identity is baked into any data shape.** Groups, lessons and progress
  are independent of who is reading them, and that must remain true.

## 12. Open questions

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
