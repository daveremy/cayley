# Design system

The spec for issue #16. Implement from this file. The research behind it is in the
workflow transcript; you should not need it.

Written after three adversarial critiques. All three returned `needs-work`. Every
change they forced is marked below with a *critique* note saying what it caught.
Where a critique was overruled, that says so too.

---

## The two rules

**Colour never touches a glyph.** Every letter on the site is `--ink` or
`--ink-muted`. Prose, headings, table cells, display equations, and the generator
letters drawn inside diagrams. Colour exists as strokes and as rules underneath
type. Nothing else.

That single rule does three jobs. It removes the WCAG failure that sinks coloured
mathematical terms elsewhere. It stops notation looking like a warning label. And
it forces the diagram's identity into non-colour channels, which is what #17 asks
for.

The second rule is the **generator signature**. Generator `a` is one bundle: hue,
dash rhythm, arrowhead shape, italic letter. That same bundle appears on the
arrow, under the word in the sentence, in the table header, and beside the code
identifier. There is no legend because nothing needs looking up.

Everything else in this file is those two rules plus the accessibility floor.

---

## Do this before writing any CSS

Three renders. They settle most of the open questions, and two of them decide
whether the central ideas survive.

1. **A D₄ Cayley diagram at final size, both themes, with a label on every edge.**
   Then the same for a group of order 24. Decide honestly whether the per-edge
   label is readable at that density or has to become per-edge-class.
2. **The prose mirror at 19px**, in Roman and Italic, across a line break, on a
   word with a descender, both themes. If the dash rhythm does not survive, the
   prose mirror drops to hue plus letter and the signature loses a channel.
3. **Lesson 1 screen 4**, the three-register panel, at 59rem and at 380px. Serif
   prose, MathML and Monaspace in three columns is the product's real layout
   problem and it is unsolved on paper.

*What the distinctiveness critique caught:* the proposal had three CI gates, four
validator invocations and two subset commands, and not one sentence describing
what a page looks like. Enforcement was standing in for design. Render first.

---

## Colour

All colour is custom properties on `:root`. No `rgba(0,0,0,α)`, no `#000`, no
hardcoded hue anywhere in the CSS, the SVG generator, or the engine. Colours enter
the diagram engine as parameters. The theme owns them.

`web/src/styles/tokens.css`:

```css
:root {
  /* chrome */
  --paper:      #FFFFF8;  /* warm page ground */
  --ink:        #1A1A1A;  /* all type. 17.33:1 */
  --ink-muted:  #565650;  /* sidenotes, captions, build stamp. 7.37:1 */
  --rule:       #8A8A82;  /* table header rule, hr, blockquote edge. 3.46:1 */
  --structure:  #9A9A92;  /* geometry that carries mathematics. 3.1:1 */
  --rule-faint: #DCDCD4;  /* decorative figure hairlines ONLY. 1.37:1 */
  --accent:     #9A6300;  /* interaction ochre. 5.03:1 */

  /* diagram ramp */
  --gen-0: #0072B2;
  --gen-1: #D55E00;
  --gen-2: #1A1A1A;  /* identical to --ink, deliberately */
  --gen-3: #B5528C;
  --gen-4: #009E73;
}
```

Dark:

```css
:root {
  --paper:      #151515;
  --ink:        #EDEDE8;  /* 15.55:1 */
  --ink-muted:  #A0A099;  /* 6.94:1 */
  --rule:       #6C6C64;  /* 3.4:1 */
  --structure:  #6E6E66;
  --rule-faint: #2A2A26;
  --accent:     #E8A33C;  /* 8.47:1 */

  --gen-0: #56B4E9;
  --gen-1: #E69F00;
  --gen-2: #EDEDE8;  /* identical to --ink */
  --gen-3: #CC79A7;
  --gen-4: #009E73;
}
```

`--accent` is used in exactly two places: a 1.5px solid ledge under an in-prose
figure control, and the focus ring. Never as a text colour. Never inside a
diagram. It means "this changes the figure beside you", not "this takes you
elsewhere".

Links spend no accent at all:

```css
a { color: inherit; text-decoration-thickness: 0.05em; text-underline-offset: 0.12em; }
```

The signal is a rule, not a hue, so it is colourblind-safe by construction and
needs no dark override.

`--gen-2` equals `--ink` on purpose. It is the only slot unchanged under
protanopia, deuteranopia, tritanopia and achromatopsia. Making it the colour of
the prose is the argument that the diagram and the sentence are one document. The
lightness-band and chroma-floor checks fail on g2. That is expected and
documented, not fixed by tinting it.

Green is not the site accent. The old `#1b7f4b` is both a Tailwind value and a
plausible generator colour, and two meanings would collide in the first diagram
that uses g4.

Every de-emphasis is a token or `color-mix(in oklch, var(--ink) 62%, var(--paper))`.

### What the accessibility critique caught

**g3 changed from `#CC79A7` to `#B5528C`.** The old value measured 3.05:1 against
`#FFFFF8` normally and dropped to 2.85:1 under deuteranopia, which is a 1.4.11
failure for the exact reader #17 is about. The old CI gate simulated CVD for
pairwise separation but measured contrast-against-ground on unsimulated colours.
Contrast is not CVD-invariant. The new value is ~4.0:1 normal and ~3.7:1
deuteranopic and holds its separation from g1.

**`--structure` is new.** The proposal drew cosets and the identity ring in
`--rule-faint`, which is 1.37:1 light and 1.27:1 dark. Coset partitions are the
content of the lesson, not decoration. `--rule-faint` is now for figure hairlines
and nothing else. Anything that carries mathematics uses `--structure` at a 1.5px
floor.

**Dark `--rule` changed from `#5E5E56` to `#6C6C64`.** The old value was 2.79:1 on
`#151515`. Tables have no borders and that one rule is the only structural
separator, so it needs 3:1. The proposal audited the generator ramp exhaustively
and never audited the chrome.

**Light g4 `#009E73` measures 3.10:1 under protanopia.** It passes. It is 0.1
above the bar, so it is in the validator's checked set and any future nudge to it
needs a re-run.

### The validator, pinned

The old ΔE figures did not reproduce. Pin the model in the code and in this file:

> Machado 2009, severity 1.0, ΔE2000 in CIELAB D65.

Under that model the light ramp's worst pairs are 12.2 (protan, g0/g3), 15.9
(deutan, g3/g4), 12.4 (tritan, g0/g4). Dark: 14.0 / 15.7 / 10.9. Gate at ΔE2000 ≥ 8
for all pairs in all four vision conditions. Commit the per-pair matrix as a
fixture in `test/fixtures/palette-matrix.json` so the number can be diffed.

Re-measure after the g3 change. The numbers above predate it.

Second assertion, which the old validator lacked: for each generator, simulate
protan / deutan / tritan at severity 1.0, then compute contrast against the
**simulated** ground, and require ≥ 3:1 in all four conditions. Add every chrome
token to the checked set, not just the ramp.

Cap at five generators. Refuse to auto-generate a sixth hue; emit a warning
instead. A six-generator diagram is a different visualisation, not a cycled
palette.

No runtime colourblind-mode toggle. It costs JavaScript, makes accessibility
opt-in, and does nothing for the reader who does not know they are colourblind.

---

## Typography

### Faces

| Role | Face | Licence | Bytes |
|---|---|---|---|
| Body | XCharter Roman | OFL 1.1 + LPPL | 22,784 |
| Emphasis, h2 | XCharter Italic | OFL 1.1 + LPPL | 16,960 |
| Code | Monaspace Xenon Regular | OFL 1.1 | 8,952 |
| Maths | XCharter Math (core slice) | OFL + LPPL 1.3c | ~25,000 |
| Maths | XCharter Math (tail slice) | OFL + LPPL 1.3c | ~29,000 |

Total ~102 KB. All self-hosted in `web/src/assets/fonts/`, loaded through Astro 7
`fontProviders.local()`. Never `public/`, never Google Fonts, never @fontsource at
runtime.

XCharter is Matthew Carter's Bitstream Charter, extended by Michael Sharpe. It has
a real MATH companion by a design partner, which is why it beats Source Serif 4
and STIX Two Text here. Literata and IBM Plex Serif have x-heights of 0.507 and
0.516, which make any maths face beside them look shrunken. ET Book has no WOFF2,
no bold italic, no web small caps, and goes spindly on dark.

Monaspace Xenon is a slab-serif monospace with x/cap 0.703 against XCharter's
~0.70. The register changes and the voice does not. JetBrains Mono is 2.1× the
bytes and its 0.753 x/cap dominates any serif. Geist Mono reads as Vercel. IBM
Plex Mono is the default look of a hundred docs sites.

**XCharter Bold is not shipped.** Neither is Monaspace Xenon Italic.

*What the performance critique caught:* the proposal's font numbers were written,
not run. XCharter Roman with the requested features is 22,784 B, not the claimed
~14,000. Three faces are 56,564 B, not 42,000. The full stack came to 141.3 KB
against a stated 100 KB budget, and no variant preserving the design commitments
fit. Bold cost 16,820 B and bought bold `<th>` and nothing else. Xenon Italic had
no specified use anywhere. Both are cut; `<th>` is set in small caps instead,
which costs zero bytes because `smcp` is already in the Roman subset.

### Subsetting

```sh
pyftsubset XCharter-Roman.otf \
  --unicodes='U+0020-007E,U+00A0,U+00A9,U+00B0,U+00D7,U+00E9,U+00F6,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2032,U+2192,U+2260,U+2264,U+2265' \
  --layout-features='kern,liga,onum,lnum,tnum,smcp,c2sc,sups' \
  --flavor=woff2
```

Same command for Italic. `frac` is dropped: XCharter Roman has no `frac` feature,
it was silently ignored, and its presence in the old command is how you can tell
the command was never run.

Maths, split into two slices by unicode-range:

```sh
# core — preloaded. ASCII, relations, math italic.
pyftsubset XCharterMath-Regular.otf \
  --unicodes='U+0020-007E,U+2124,U+211A,U+211D,U+2102,U+2115,U+210D,U+2119,U+2113,U+2118,U+2208,U+2209,U+2286,U+2282,U+22B4,U+22B5,U+2245,U+2260,U+2264,U+27E8,U+27E9,U+2223,U+2218,U+2205,U+21A6,U+2192,U+2261,U+00D7,U+00B7,U+2212,U+2215' \
  --layout-features='kern,ssty,dtls,ss01,ss04' --flavor=woff2

# tail — lazy. Greek, the alphanumeric planes we actually reach.
pyftsubset XCharterMath-Regular.otf \
  --unicodes='U+0370-03FF,U+1D434-1D467,U+1D53D,U+1D542,U+2200,U+2203,U+22CA,U+22C9,U+2295,U+2297,U+2211,U+220F,U+222A,U+2229,U+2216,U+22EF' \
  --layout-features='kern,ssty,dtls,ss01,ss04' --flavor=woff2
```

*What the performance critique caught:* the original charset included the whole
U+1D538–1D56B double-struck plane at a cost of 11,156 B for two reachable glyphs.
Temml emits real Letterlike codepoints for `\mathbb{Z,Q,R,C,N,H,P}`, which is the
argument for choosing Temml in the first place. Only `\mathbb{F}` (U+1D53D) and
`\mathbb{K}` (U+1D542) reach into the plane. The `--layout-features='*'` wildcard
cost another 4,872 B for features nothing references, and it made the CI assertion
that named features survived vacuous.

There is a hard floor here you cannot subset away. XCharter Math down to ASCII
alone is 22,396 B, because MATH closure retains 14 vertical and 5 horizontal glyph
assemblies regardless of charset. Any real maths font costs that. The decision is
only about the payload on top of it, which is why the face splits.

CI asserts `'MATH' in TTFont(f)` on both slices, and that `ssty` and `dtls`
survived.

### Loading

```css
@font-face {
  font-family: 'XCharter'; src: url(...) format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {  /* metric-matched fallback — kills the swap reflow */
  font-family: 'XCharter Fallback'; src: local('Times New Roman');
  size-adjust: __%; ascent-override: __%; descent-override: __%; line-gap-override: 0%;
}
@font-face {
  font-family: 'XCharter Math'; src: url(...core.woff2) format('woff2');
  unicode-range: U+0020-007E, U+2100-22FF; font-display: block;
}
@font-face {
  font-family: 'XCharter Math'; src: url(...tail.woff2) format('woff2');
  unicode-range: U+0370-03FF, U+1D400-1D7FF; font-display: block;
}
```

Fill the `__` values by running fontTools against XCharter Roman and Italic and
the local fallback, or let Astro's font API generate them. Both faces need them.

Preload Roman and the maths core only. That is 22.8 + 25 = 47.8 KB, about 240 ms
of transfer on Lighthouse Slow 4G, and it lands correct notation near 900 ms.

Body text uses `swap`. Maths uses `block`. Prose in the wrong serif for 200 ms is
survivable; notation in the wrong serif is the failure this whole project is
about.

*What the performance critique caught:* two things. First, the reported LCP passed
only because `swap` painted fallback text — measured time-to-correct-notation was
1.2 s while the reported LCP was 0.65 s. Measure and assert time-to-correct-notation,
not LCP. Second, the maths fallback chain is `'XCharter Math', 'STIX Two Math',
'Cambria Math', math, serif`. Cambria Math is Windows-only and iOS does not bundle
STIX Two Math, so on iPhone the chain falls through to a serif with no MATH table:
non-stretching ⟨ ⟩, broken radicals, wrong operator spacing, on every cold load.
`block` plus preload means notation is briefly absent rather than briefly wrong.
Verify on a real iPhone before this ships. It is a five-minute check that gates a
headline decision.

### Scale

Root `html { font-size: 16px }`.

| Element | Size | Detail |
|---|---|---|
| Body | 1.1875rem / 19px | line-height 1.6 (30.4px) |
| h1 | 2.25rem / 36px | roman 400, line-height 1.1, `letter-spacing: -0.012em` |
| h2 | 1.5rem / 24px | italic 400, line-height 1.25, margin `2.75rem 0 0.75rem` |
| h3 | 1.25rem / 20px | roman 400, small caps, `letter-spacing: 0.06em`, `margin-top: 2rem` |
| Sidenote, caption, gutter label | 0.9375rem / 15px | line-height 1.45, `--ink-muted` |
| Inline code | 1em | `font-size-adjust: ex-height 0.481` |
| Block `<pre>` | 0.9375rem | line-height 1.5 |
| Display maths | 1.15em | `margin: 1.6rem 0`, centred |
| Table body | 1rem | `lining-nums tabular-nums` |
| Arrow label | 1rem floor | see Diagram encoding |
| Footer, build stamp | 0.875rem | `--ink-muted` |

Headings differentiate by size, italic and small caps. Never by weight. Never by a
`border-bottom` rule, which is the strongest SaaS tell in Distill's stylesheet.

Prose uses `font-variant-numeric: oldstyle-nums proportional-nums`. Generated
tables override to `lining-nums tabular-nums`. Emphasis is italic and real small
caps; XCharter has genuine `smcp`/`c2sc` so browsers will not synthesise them.

*What the accessibility critique caught:* h3 was specified at 1.1875rem, identical
to body, at weight 400, differentiated only by small caps and tracking. For a
low-vision reader or anyone scanning at 200% zoom, that is a paragraph that starts
in small caps. It is now 1.25rem with 2rem of space above.

```css
code, kbd, samp, pre {
  font-family: 'Monaspace Xenon', ui-monospace, monospace;
  font-size-adjust: ex-height 0.481;
}
```

That one line puts inline code on the same optical line as the serif with no JS.

### Measure

```css
:root { --measure: 38rem; --gutter: 19rem; --gap: 2rem; }
```

38rem is 608px of **content box**. `box-sizing: border-box` with padding outside
the measure, not inside — the current page's `max-width:46rem; padding:3rem 1.5rem`
is the mistake this replaces. At 19px XCharter that is 66–68 characters per line.

Paragraph spacing 0 top, 1rem bottom. No first-line indent.

Ciechanowski runs a median 82 characters per line and Distill 83. Both are wrong
here. Cayley's lines carry inline MathML read by someone who finds notation
frightening, and a notation-dense line costs more per character than prose.

The gutter is 19rem, exactly half the measure. Distill's 152px gutter is a label
column, not a digression column.

---

## Maths pipeline

**Temml 0.13.3, not KaTeX.** This replaces the `remark-math` + `rehype-katex`
pipeline in issue #15 and keeps the constraint that pipeline existed to satisfy:
still build-time, still zero runtime JS.

The reason is concrete. KaTeX and MathJax both emit
`mathvariant="double-struck"` for `\mathbb{Z}`. MathML Core deprecates that
attribute and Chromium has never implemented it, so ℤ/nℤ renders as a plain italic
Z in Chrome and Edge. Temml emits the real codepoint `<mi>ℤ</mi>` (U+2124). Temml
is also about 5× smaller on the wire: `\mathbb{Z}/n\mathbb{Z}` is 66 B against
KaTeX's 312 B (mathml) or 638 B (htmlAndMathml).

Native MathML also inherits `color`, so `<math>` needs no dark-mode override at
all. Distill's maths CSS hardcodes `span.katex { color: rgba(0,0,0,0.8) }` and is
permanently stuck with it.

### Migration steps

1. `npm rm rehype-katex katex` in `web/`.
2. `npm i temml` (and `@daiji256/rehype-mathml@1.2.2` only if step 4 passes).
3. Delete the KaTeX stylesheet link. There is no replacement stylesheet; the
   workarounds below are inlined.
4. Verify `@daiji256/rehype-mathml` emits `<math display="block">` for `$$…$$`. It
   did not in testing. If it cannot be configured to, drop the plugin and call
   `temml.renderToString(src, { displayMode: true })` from the engine, which emits
   `display="block"` and `class="tml-display"`. Calling from the engine is the
   better end state anyway: the engine should emit notation rather than the
   markdown containing it.
5. CI asserts every `$$…$$` produces `<math display="block">`. Silent failure mode
   is that every display equation renders inline-sized and left-aligned, which on
   this site is a product failure, not a styling bug.
6. Emit the LaTeX source to `data-tex` only. Not `<annotation>`, and not both.

On step 6: Temml emits no `<annotation>` by default and needs `{annotate: true}`,
which costs +125 B raw per formula. Mirroring the same TeX into `data-tex` as well
triplicates it — about 3.5 KB raw per page at 14 formulas. `data-tex` alone is
what a copy-to-clipboard affordance reads. It also avoids a Chromium bug that
leaks `<semantics>` non-first children into the accessibility tree, which would
read raw LaTeX aloud after every formula. Revisit only if the AT matrix shows
`<annotation>` is needed.

### Maths CSS

```css
math, .tml {
  font-family: 'XCharter Math', 'STIX Two Math', 'Cambria Math', math, serif;
  font-size: 1.041em;      /* x-height 0.462 vs Roman's 0.481 */
  font-size-adjust: none;  /* rescaling breaks the MATH table's AxisHeight */
  font-feature-settings: 'dtls' off;  /* Firefox drops the dot on i/j otherwise */
}
mfrac > :nth-child(2), msqrt, mover > :first-child { math-shift: compact; }

math:not([display="block"]) { display: inline-flex; flex-wrap: wrap; align-items: baseline; }
math[display="block"] { display: block math; text-align: center; }

@supports (-moz-appearance: none) {
  math:not([display="block"]) { display: inline; }
}
```

Never set `font-size-adjust` on maths. The MATH table's AxisHeight and script
percentages are computed against the real em.

*What the accessibility critique caught:* the escape hatch was
`@-moz-document url-prefix() { math { display: inline } }`. `@-moz-document` has
been disabled in author stylesheets since Firefox 61, so it was dead code and
Firefox received the flex hack un-escaped. Overriding `display` on `<math>` also
replaces MathML layout on that box, so block equations now get their own rule
rather than inheriting a hack meant for inline wrapping.

### Line breaking

Wrap only the closing delimiter plus its trailing punctuation in nowrap. Never the
whole expression:

```html
<!-- wrong: white-space inherits into the subtree and kills flex-wrap -->
<span class="m" style="white-space:nowrap">…whole formula…</span>

<!-- right -->
…formula…<span class="m-tail">⟩.</span>
```

Or put a zero-width no-break space between `</math>` and the period.

For Safari, insert explicit break opportunities at top-level relational operators
at build time. The engine has the parse tree; the browser does not.

*What the accessibility critique caught:* the proposal introduced
`flex-wrap: wrap` to let `⟨a, b ∣ a⁴ = b² = (ab)² = e⟩` wrap inside 38rem, then
four sentences later specified `white-space: nowrap` on the whole expression.
`white-space` inherits, so it suppressed the wrapping just enabled. At the 320px
viewport that 1.4.10 Reflow requires, after 2×4rem page padding leaves ~192px, a
group presentation forces the page body to scroll horizontally. Safari makes it
unconditional because it has no MathML automatic line breaking at all. This was
filed as an open question; it is a present AA failure on the platform Dave reads
on.

Temml ships a workaround stylesheet per maths font because the corrections depend
on that font's MATH constants. There is no XCharter Math variant. Author one from
XCharter Math's own constants rather than copying the STIX-tuned values; STIX Two
Math's x-height is 0.473 against XCharter Math's 0.462, so STIX corrections will
mis-position the constructions they exist to fix.

`math-style: normal` is exposed as a per-page body class for readers who want more
room. Zero JS, and impossible with KaTeX's baked-in spans.

### The notation test fixture

These twenty patterns are a test fixture, not an open question. Render them in
Chrome, Firefox and Safari at 380px and 320px, and run them through the AT matrix
below:

subscripted elements · `⟨generators ∣ relations⟩` · quotients `ℤ/nℤ` · semidirect
products · set-builder · `|G| = |Orb|·|Stab|` · `(ab)²` and other short
parenthesised powers · nested fractions · `r⁻¹` · cosets `gH` · direct products
`C₂ × C₂` · `≅` between presentations · `∘` composition chains · `e` as identity ·
big operators `∑ ∏` · matrices · overset arrows · `∀ ∃` · absolute-value bars
around a group · stacked superscript-subscript.

---

## Diagram encoding

A Cayley diagram is nodes and edges. Nodes first.

### Nodes

The node carries more information than the edge and it carries the product's
thesis. Lesson 1 spends five screens establishing that elements are moves, so a
node that shows the move is the strongest thing this system can do.

- Node is a 44px rounded square, corner radius 4px, `--paper` fill, 1.5px
  `--structure` stroke.
- If the group's JSON declares a drawable domain object, the node contains a 32px
  drawing of that object in its moved position. Otherwise it contains the element
  name in XCharter Math italic at 1rem, `--ink`.
- The identity node takes a 2px `--ink` stroke. Nothing else changes.
- Coset grouping is whitespace plus a 1.5px `--structure` boundary. Never a fill,
  never a tint.
- Layout is deterministic, from a layout hint in `groups/*.group.json`. No
  force-directed solver. A diagram must render identically in CI and in the
  browser, or the greyscale gate compares two different pictures.

*What the distinctiveness critique caught:* the proposal spent roughly 1,500 words
on edges and zero on nodes. Node shape, size, label placement, identity treatment,
coset grouping and layout algorithm were all absent. It also identified the
moved-object node as the one move no other group-theory tool makes, and the one
lesson 1 has already argued for.

### Edges: five channels

All five ship on every edge, always. Not only when the palette gets tight.

**Channel 1, the italic letter.** Every arrow carries its generator letter in
XCharter Math italic, `--ink`, minimum 1rem, upright and horizontal at the arc
midpoint. Never rotated, never on a `<textPath>`. Behind it sits a `--paper`-filled
rounded rect, 2px corner radius, sized to the glyph bounding box plus 2px:

```css
.arrow-label-bg { fill: var(--paper); }
.arrow-label    { fill: var(--ink); font-size: calc(1rem * var(--label-scale, 1)); }
@media (forced-colors: active) {
  .arrow-label-bg { fill: Canvas; }
  .arrow-label    { paint-order: normal; stroke: none; }
}
```

The label is set in the maths face, so the `r` on the arrow is glyph-identical to
the `r` in `⟨r, f ∣ r⁴ = f² = e⟩` two lines below.

Do not set labels in Atkinson Hyperlegible. A third typeface for the one thing
that must look identical across all three registers would break the product's
central claim.

*What the accessibility critique caught:* two problems with the original halo. In
Windows forced-colors mode both `fill` and `stroke` are forced, so a
`paint-order: stroke` paper halo becomes CanvasText — the same colour as the glyph
— and every generator letter renders as a fattened blob. The claim that the
greyscale render test covered forced-colors was wrong; that test forces strokes to
`--ink` but leaves the halo as paper, testing a rendering forced-colors never
produces. Separately, in dark mode ink-on-stroke measures 1.96:1 (g0), 1.92:1 (g1),
2.61:1 (g3), 2.91:1 (g4) and 1.00:1 (g2, where the label sits on a stroke of its
own exact colour). The halo was the only thing making dark labels legible. A filled
rect fixes both. The size floor also moved from 0.875rem to 1rem: the highest-stakes
glyph in the product was set smaller than everything else on a site whose thesis is
that typography is the product.

Label size scales from `--label-scale`. The layout solver reserves label bounding
boxes and re-solves when the scale changes, because `font-size` inside a viewBox'd
SVG resolves against the root font size while node coordinates do not. A low-vision
reader who raises their default font size, or uses Firefox's text-only zoom, gets
labels that grow past their backgrounds and collide with each other otherwise.

**Channel 2, hue.** `stroke: var(--gen-N)`. Emitted as inline `<svg>` in the HTML.
Never `<img src="*.svg">`, because page-declared `@font-face` does not apply inside
an image-referenced SVG and the label channel would silently fall back to the
system serif. Never canvas or WebGL, which forfeits CSS theming, print, native
zoom, text selection, `<title>`/`<desc>` and JS-off rendering in one move.

**Channel 3, dash rhythm.** Stroke width w = 2px.

| Slot | Class | dasharray |
|---|---|---|
| g0 | dotted | `0.01 5` with `stroke-linecap="round"` |
| g1 | dashed | `8 5` |
| g2 | solid | none |
| g3 | long-dash | `14 5` |
| g4 | dash-dot | `6 4 1.5 4` |

Dash arrays are computed at build time against the rendered scale and normalised
with `pathLength` so every edge shows the same number of cycles regardless of
length. Set a minimum edge length per dash class in the layout solver; below it,
fall back to arrowhead and label only.

*What the accessibility critique caught:* g0 and g2 swapped rhythms. g2 is the
achromatic slot, the one that must carry identity alone under achromatopsia and
forced-colors, and it had been given the faintest rhythm in the set while g0 —
which has the strongest hue separation in every CVD condition, worst pair 12.2 —
got solid. `stroke-dasharray="0 5"` is also the ambiguous case in SVG; `0.01 5` is
portable.

The same critique killed `vector-effect="non-scaling-stroke"` as the sole
mechanism. It freezes stroke width in device pixels while dasharray stays in user
units, so the dash-to-width ratio drifts under any transform and an `8 5` dash at
scale 0.5 reads as nearly solid. Dashes also phase from the path start, so two
edges of different length showed different partial patterns. Measured greyscale
ΔE2000 between light g3 and g4 is 2.9 and dark g0/g1 is 0.6, so under
achromatopsia and forced-colors dash and arrowhead carry identity by themselves —
and a D₄ f-edge is 20–40px, at which length a 19px-period long-dash and a
15.5px-period dash-dot are the same mark.

**Channel 4, arrowhead shape.** One closed filled polygon per arrow, shaft and
head in a single path. Not a stroked line plus a `<marker>`. Shaft w = 2px, head
width 6px, head length 8px.

g0 filled triangle · g1 open chevron · g2 triangle with perpendicular bar tail ·
g3 double chevron · g4 diamond.

All five must read as directional and point the same way. Arrowhead direction
already carries x·g against g·x, which is the whole reason this project exists.
The diamond is weakest on that count and is why g4 is the last slot allocated.

**Channel 5, the prose mirror.** When a sentence names a generator, the word stays
`--ink` and takes an underline in that generator's hue and rhythm:

```css
.gen-1 {
  text-decoration: underline;
  text-decoration-color: var(--gen-1);
  text-decoration-style: dashed;
  text-decoration-thickness: 2px;
  text-decoration-skip-ink: none;
  text-underline-offset: 0.32em;
}
@media (forced-colors: active) {
  .gen-0, .gen-1, .gen-2, .gen-3, .gen-4 {
    background-image: none;
    text-decoration: underline solid;
  }
}
```

Class names are indexed, never semantic. `.gen-0`, not `.color-red`. Red and green
as adjacent semantic names is what #17 forbids.

*What the accessibility critique caught:* `text-decoration-skip-ink` defaults to
`auto`, so the browser punches gaps in the underline at every descender, which is
indistinguishable from and destructive of the dash rhythm that is the point of the
channel. Turning skip-ink off creates the opposite problem: 0.22em offset at 19px
is 4.2px, inside XCharter's descender depth, so a 3px rule strikes through
descenders. Offset moved to 0.32em and thickness to 2px, because 3px out-weights a
19px serif stem. Separately, three of the five rhythms need a
`repeating-linear-gradient` fallback, and background images are suppressed in
forced-colors mode — so the prose mirror vanished entirely in High Contrast while
the diagram's dash channel survived. The forced-colors rule degrades it to hue plus
letter instead of to nothing.

The gradient fallback for dotted-round, long-dash and dash-dot is unverified.
Render test 2 at the top of this file settles whether it survives a descender and a
line break. If it does not, the prose mirror is hue plus letter and the dash rhythm
is diagram-only.

### Stroke weight is not an identity channel

It is a three-tier emphasis hierarchy, in screen pixels, divided by the current
transform scale:

- 1.5px `--structure` for construction geometry: cosets, the identity ring.
- 2px `--gen-N` for the graph itself.
- 4px for the single path currently under discussion.

---

## Product components

The essay furniture below matters less than these. Lesson 1 is five screens with
two buttons, a filling strip, a probe with an unpenalised "I don't know", branching
feedback, and a closing boundary block. None of that is prose with digressions.

*What the distinctiveness critique caught:* the proposal designed sidenotes, a
digression column, figure density and blockquote edges, and gave no form to a
single recurring form the product actually has. It is the default a careful person
reaches for after reading Tufte and Ciechanowski. It solves their layout problem,
not this one.

### The symbol gloss

The signature component. The failure log entry that this product exists to answer
is *"i feel shaky when i see them. like i want to cry actually."* What fixed it was
a decoder ring: symbol → plain sentence → the code he already knew. Not a typeface.

```html
<a class="gloss-link" href="#gloss-in">∈</a>
…
<aside class="gloss" id="gloss-in">
  <span class="g-sym"><math>…</math></span>
  <span class="g-say">"is in" — a is one of the things in the set S.</span>
  <code class="g-code">S.includes(a)</code>
</aside>
```

- `.gloss-link` is `color: inherit` with a 1px dotted `--accent` underline. It is
  the one place a dotted underline is used, so it never collides with a nav link
  (hairline solid) or a figure control (1.5px ledge).
- The `<aside>` sits at `grid-column: gutter-start / page-end`. Above 64rem it is
  always visible. Below 64rem it is `display: none` until `:target`.
- Three rows in the three registers, same order as the three-register panel:
  notation, plain sentence, code.
- Zero JS. `:target` does all of it.

This overrules the proposal's "never a legend" rule. That rule is Tufte's
conclusion about statistical graphics, and this project has measured data on this
exact learner that contradicts it. A gloss is not a legend: the legend the
generator signature deletes is the one that makes you look away from the diagram to
decode a colour. The gloss makes an unfamiliar symbol readable in place.

### The three-register panel

The product's real layout problem. Picture, notation, code, from one computed
`Group`.

```
≥64rem   .w-page (59rem), three columns: 20rem / 16rem / 23rem
         1px --rule verticals between. No header background, no box.
         Column headers: small caps, 0.9375rem, --ink-muted.
<64rem   stacks in that order. Headers become the same small caps labels.
```

Picture column holds the diagram at 20rem. Notation column holds display maths at
1.15em, centred in its own column, which means the 38rem measure does not apply and
the maths CSS needs testing at 16rem. Code column is Monaspace Xenon at 0.9375rem,
comments in `--ink-muted`.

Every value computed from `groups/*.group.json`. Nothing transcribed.

### The probe

```
Options are real <button> elements. Row above 40rem, stacked below.
Each button: --ink text, 1.5px solid --accent ledge, small caps, 0.5rem 1rem padding.
"I don't know" is a third button, identical size and weight, --ink-muted text,
  same ledge. Never smaller. Never styled as a link. Never below a divider.
Feedback lands in an aria-live="polite" region below the buttons.
  --ink, body size. No red, no green, no icon, no "incorrect".
```

The wrong answer is the interesting one and it must look as reachable as the right
one. The feedback speaks group theory, not grading.

### The boundary block

WHAT YOU LEARNED / WHAT WE PARKED / STILL A LIE, at `.w-text`.

A two-column definition list. Labels in small caps, 0.9375rem, `--ink-muted`, in a
10rem left column. Content in `--ink` at body size. One 1px `--rule` above the
whole block and nothing else. No box, no background, no colour on the lie row.
Parking is a method commitment, not a warning.

### The element strip

Node components at 44px, wrapping, `.w-text`. Counter to the right in small caps,
0.9375rem, `--ink-muted`, tabular figures. It reads `4 of ?` and does not give away
the count. Chips appear in discovery order, never canonical order.

New chips fade in over 120ms. Under `prefers-reduced-motion: reduce` they appear.

### The multiplication table

Kill `th, td { border: 1px solid }`. One 1px `--rule` under the header row and one
to the right of the header column. Nothing else.

```css
table { border-collapse: collapse; font-variant-numeric: lining-nums tabular-nums; }
th, td { padding: 0.45rem 0.9rem; }
th { font-variant: small-caps; font-weight: 400; }
```

No zebra striping. No cell backgrounds.

Block structure means subgroups and cosets. Show it with rule weight and
whitespace, not shading: a 2px `--ink` rule at each coset boundary and a 0.35rem
gap between blocks. Test on D₄'s 8×8 before locking it.

At 8×8 the table escapes to `.w-page` and drops to 0.875rem with `0.25rem 0.5rem`
padding rather than scrolling. A table you scroll horizontally cannot show a
pattern, and the pattern is the lesson. `overflow-x: auto` is the last resort, not
the design.

*What the distinctiveness critique caught:* the table got two sentences and an
overflow rule. The standard technique for teaching cosets from a table is shading
the blocks, which "colour never touches a glyph" forbids with nothing offered in
its place. The non-colour mechanism above is the replacement. Whether the rule
should be amended for highlighting is Dave's call; see below.

---

## Layout

Distill's named-line grid, parameterised, applied to every top-level element so the
left text edge never moves:

```css
:root { --measure: 38rem; --gutter: 19rem; --gap: 2rem; }
body > *, .grid {
  display: grid;
  grid-template-columns:
    [screen-start] 1fr
    [page-start] minmax(0, 4rem)
    [text-start] minmax(0, var(--measure)) [text-end]
    var(--gap) [gutter-start] var(--gutter) [gutter-end]
    minmax(0, 4rem) [page-end]
    1fr [screen-end];
}
```

Four named escape widths: `.w-text` (38rem, default), `.w-outset` (46rem),
`.w-page` (59rem), `.w-screen` (100vw, almost never). Discrete names, not ad-hoc
`width: 120%`, because the reading rhythm depends on a stable left edge.

At 64rem the grid collapses to one column, the gutter disappears, and gutter
content becomes disclosures. Designed into the grid, not bolted on. Distill's
flagship articles shipped `html { min-width: 1200px }` and a `/* no mobile
support */` comment because they deferred it.

**Figures.** No border, no background, no shadow, no caption box. The figure sits
on the paper. Box reserved with `aspect-ratio` before anything mounts, so an island
causes no layout shift.

**Captions.** The sentence introducing a figure does the typographic work, and a
visually-hidden `<figcaption>` carries the relationship. Removing the visible
caption must not remove the programmatic association.

*What the accessibility critique caught:* "the sentence before the figure is the
caption" is a defensible editorial rule and, on its own, a 1.3.1 failure. The
describing sentence sits in a preceding `<p>` with no relationship to the
`<figure>`. Either put the sentence's id in the figure's `aria-labelledby`, or emit
a hidden `<figcaption>`. The look is unchanged.

**Sidenotes.** Generated at build time by a rehype plugin from GFM `[^1]`. Authors
never hand-write the label/input/span triple. Pure CSS float, zero JS.

Four requirements, three of which are fixes over Tufte CSS:

1. The numeral is real text inside the `<label>`, not a CSS `counter()`, so it is
   selectable and present in the accessibility tree.
2. The plugin flattens the `<p>` wrapper out of footnote content. A nested `<p>`
   inside an inline `<span>` silently deletes the note.
3. The input is hidden with the clip-path visually-hidden pattern, never
   `display: none`. Tufte CSS uses `display: none`, which removes the control from
   the tab order and the accessibility tree, so below 64rem sidenotes cannot be
   opened by keyboard or screen reader at all.
4. The label carries `aria-label="note 1"`. A bare numeral is not an accessible
   name. If `<details>`/`<summary>` is acceptable typographically, prefer it — it
   is keyboard- and SR-correct with zero JS and no aria at all.

House rule: sidenotes are prose only. They are spans and cannot legally contain
lists or display equations, which in group theory comes up constantly. Anything
needing a display equation or a diagram becomes a block `<aside>` at
`grid-column: gutter-start / page-end`.

**In-prose figure controls.** Real `<button>`, mid-sentence, `--ink` with a 1.5px
solid `--accent` ledge and small caps. Never `href="#"` with an onclick: not
keyboard-safe, not announced, inert with JS off. Controls sit below the figure,
never overlaid.

```css
.fig-ctl { border-bottom: 1.5px solid var(--accent); }
.fig-ctl:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

The 2px offset gap is filled by `--paper`, which gives the ring 5.03:1 light and
8.47:1 dark against both its neighbours.

*What the accessibility critique caught:* `--accent` served as both the focus ring
and the resting ledge, so focusing a control drew an ochre ring immediately against
an ochre ledge at 1:1 where 1.4.11 wants 3:1. The offset gap fixes it.

Every control that changes a figure carries `aria-controls` pointing at it, and the
figure carries a polite live region that the engine updates in words: *"applying r
twice: e maps to r squared."* The engine already knows the answer. It was not
saying it.

A slider is a real `<input type="range">`. Its thumb carries hue and letter, not
the full signature — a dash rhythm cannot be expressed on a thumb. The thumb gets
an explicit `:focus-visible` ring with a paper offset gap.

**Motion.** `@media (prefers-reduced-motion: reduce)` renders a small-multiple
sequence instead of a tween, from the same engine call. An animation that shows a
group action is content, so removing it removes content. Three static graphs side
by side with the value typeset beneath each is the substitute, and it reads faster.
A reduced-motion render is a build artifact, not a promise.

**Progressive enhancement.** Every diagram renders to static inline SVG at build
time by the same engine code path the interactive explorer uses. The canvas layer
is an Astro island mounted on top. Not a parallel renderer — if the JS-off fallback
and the live view can disagree about a group, that is a correctness failure dressed
as a rendering failure, and this project's whole claim is that the tool cannot show
you mathematics that is false.

Explorer pages get `IntersectionObserver` gating at `rootMargin: 100px` and
`devicePixelRatio` clamped to 2.

**Document skeleton.** `<html lang="en">`, one `<main>`, heading order never skips
a level. Stated because a spec this detailed everywhere else was silent here.

### Editorial rules that were deleted

Two rules were imported from Ciechanowski's corpus and both contradict this
project's own material:

- *"Every diagram is introduced by a sentence ending in a colon."* Lesson 1 screen
  1 is specified as "No text yet. Let them push the buttons." Zero words, one
  interactive figure.
- *"One computed diagram per 85–150 words."* Same problem.

Keep them as observations about the reference. The editorial constraints this
product has are already written down and are better: exercises are the work,
reading is preparation, and no prompt may contain its answer.

Cross-references are restored. The proposal banned them on print-register grounds,
and the parked/owed mechanism depends on them. Lesson 1 forward-references lesson 8
by name.

No table of contents, reading-time estimate, progress bar, sticky header, share
buttons, related posts, newsletter prompt, levels, XP, streaks, badges or
completion percentage. The progress model is `docs/learner-failure-log.md`.

---

## Dark mode

Token flip only. Nothing else changes.

```html
<script>
  // ~250 B, inline, render-blocking, in <head>. Zero requests.
  try {
    var t = localStorage.getItem('theme');
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) {}
</script>
```

```css
:root { /* light tokens */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { /* dark */ } }
:root[data-theme="dark"]  { /* dark  */ }
:root[data-theme="light"] { /* light */ }
:root:has(#theme-dark:checked) { /* dark — the no-JS path */ }
```

`prefers-color-scheme` is the default signal. `data-theme` overrides it in both
directions so an explicit choice always wins. The checkbox is the fallback for
readers with JS off, styled as a small caps "night" toggle in the footer.

The checkbox input sits immediately before its label in the footer, not at the top
of `<body>`. `:has()` works from anywhere, and top-of-body placement put a focusable
control before the `<h1>` with its focus indicator several thousand pixels below the
viewport. Style `:has(input:focus-visible)` on the label so focus is visible on the
thing the reader can see.

Tokens are re-declared on `:root`, not `body`, or `html`'s background will not flip.

All three critiques forced this, independently. The proposal
shipped the CSS-only checkbox and called it "session-only, flipped once per visit".
On a multi-page static Astro site, checkbox state is per document. Every internal
link resets to `prefers-color-scheme`. A learner following ten links gets ten
full-brightness flashes of `#FFFFF8`, and for a photophobic or migraine-prone reader
that is harm, not a trade-off. The budget the proposal refused to break says "zero
JS *files*" — an inline script is not a file and adds no request. It reasoned itself
out of the fix using a constraint that does not bind. The budget is restated below.

Three things the references get wrong, fixed here:

1. Muted text has its own token. Tufte CSS's dark block sets only `background-color`
   and `color` on `body`, so `.sidenote`, `.marginnote` and `figcaption` read at
   full body contrast at night, which is when this reader studies.
2. Rules are tokened. `hr { border-top: 1px solid #ccc }` is the one declaration
   tufte.css keeps hardcoded through its own dark switch.
3. The dark generator ramp is hand-picked and separately validated. No
   `filter: invert()`, no automatic lightness flip. CVD separation between two marks
   is background-independent; contrast against the ground is not. Okabe-Ito black
   swings from 20.91:1 to 1.15:1 across the flip.

XCharter is a moderate-contrast face engineered for coarse reproduction, so it does
not go spindly on `#151515` the way Libertinus Serif or ET Book do. The typeface
choice and the dark-mode requirement are the same decision.

One exception: `.dark-band`, a full-bleed section at `#151515`/`#EDEDE8` for figures
that are semantically about a dark ground, independent of page theme.

---

## Accessibility contract

Every diagram:

```html
<figure>
  <svg role="img" aria-labelledby="t-3" aria-describedby="d-3 tbl-3">
    <title id="t-3">Cayley diagram of D₄</title>
    <desc id="d-3">Eight nodes …</desc>
    <g aria-hidden="true"> … all geometry and all text … </g>
  </svg>
  <table id="tbl-3" class="visually-hidden"> … the multiplication table … </table>
  <figcaption class="visually-hidden"> … </figcaption>
</figure>
```

Three things this fixes. A bare inline `<svg><title>` is not reliably announced;
NVDA and JAWS in Chromium skip it without `role="img"` and `aria-labelledby`.
Channel 1 puts a real `<text>` on every arrow and those nodes stay in the
accessibility tree, so a D₄ diagram reads out as *"e r r² r³ f rf r²f r³f r r r r f
f f f"* after the desc — worse than silence. And a `<desc>` string cannot express a
group's edge relation.

The structured alternative is the multiplication table, which the engine already
computes from the same source. It is not a second view. It is the diagram's text
alternative, and it is nearly free.

*What the accessibility critique caught:* the entire accessibility model for the
primary content type was one sentence, "every diagram carries `<title>` and
`<desc>`". A blind learner got none of the product.

### Required test matrix

This was an open question. It is now a gate, and it runs before any content is
written.

MathML assistive-tech support is combination-dependent. VoiceOver handles it
reasonably, JAWS natively, NVDA needs the MathCAT add-on (MathPlayer is dead) and
without it flattens a group presentation to a character stream. Temml emitting the
literal `<mi>ℤ</mi>` also moves the dependency: the announcement now rests on the AT
having a name for U+2124 rather than on it understanding a `mathvariant` attribute.
That is the opposite trade from the rendering argument, and it is untested.

Run the twenty notation patterns through: VoiceOver/Safari, VoiceOver/iOS,
NVDA+MathCAT/Firefox, NVDA-bare/Chrome, JAWS/Chrome. Verify no LaTeX leaks into
speech. Verify the `display` override on `<math>` has not changed the announced
role.

For a product whose reader finds ∈ frightening, how the symbol is spoken is a
primary requirement.

### The rest of the floor

- 1.4.10 Reflow: assert at 320px across Chrome, Firefox and Safari on the twenty
  notation patterns.
- 1.4.12 Text spacing: run the bookmarklet (line-height 1.5, letter-spacing 0.12em,
  word-spacing 0.16em, 2em paragraph spacing) with no loss of content. Two likely
  failure points: sidenotes floated at `margin-right: -60%; width: 50%`, and figure
  boxes with a CSS-reserved `aspect-ratio`.
- 1.4.11: every non-text contrast in the checked set, including chrome tokens.
- 2.4.7 and 2.4.11: focus visible and not obscured on both CSS-only controls.
- 4.1.3: status messages announced when a control changes a figure.
- 200% root font size renders correctly, including arrow labels.

---

## CI gates

Per commit, milliseconds:

```sh
node validate_palette.js "$LIGHT_RAMP" --mode light --surface "#FFFFF8" --pairs all
node validate_palette.js "$DARK_RAMP"  --mode dark  --surface "#151515" --pairs all
```

`--pairs all`, not adjacent, because any two edges can meet at a node. Both the
ΔE2000 separation and the simulated-ground contrast assertions run here. Chrome
tokens are in the checked set.

Also per commit:

- Greyscale render of every generated diagram, strokes forced to `--ink`. Assert on
  the **shortest edge** in each group, not on a sheet a human eyeballs. That is the
  case that fails.
- `<math display="block">` present for every `$$…$$`.
- Font subsets: `'MATH' in TTFont(f)`, named features survived, byte ceilings.
- Page weight per page class.

On a schedule, and on changes to the palette or encoding modules only:

- Headless-Chrome contact sheet per group: normal / protanopia / deuteranopia /
  tritanopia / greyscale, × light / dark, using the Machado 2009 matrices.
- Forced-colors contact sheet, both Windows HC themes. The greyscale render does not
  substitute for it.
- 200% root font size, and a reduced-motion render.

Run the contact sheets in GitHub Actions, never in the Cloudflare Pages build. Six
renders per group at 6 groups is fine; at 100 groups it is 600+ screenshots against
a 20-minute build limit and 500 builds a month. Cloudflare Pages runs `astro build`
and nothing else.

---

## Budgets

Pinned throttle: **Lighthouse Slow 4G, 1.6 Mbps, 150 ms RTT, cold connection, cold
cache.** "4G" unqualified made the budget unfalsifiable — DevTools Fast 4G yields
LCP around 250 ms and passes trivially, while the same build on Slow 4G takes 650 ms
to first paint and 1.2 s to correct notation.

| Budget | Value |
|---|---|
| Time to correct notation | ≤ 1.0 s, cold, Slow 4G |
| Fonts, total, cached site-wide | ≤ 110 KB |
| Fonts, preloaded | ≤ 50 KB |
| Standard lesson page, HTML + inline CSS | ≤ 8 KB gz |
| Large-group page | set per page, engine warns above 24 diagram elements |
| Explorer page | ≤ 200 KB |
| JS requests on content pages | zero |
| Inline script, content pages | ≤ 1 KB |

The headline metric is time to correct notation, not LCP. LCP passes on fallback
text, which is the mechanism that hides the product.

*What the performance critique caught:* the 4 KB gz page budget was about 2× over
on a typical lesson. Real English prose gzips at 0.46, so 1,200 words is ~3.0 KB,
14 Temml formulas add ~0.4 KB, eight inline D₄ diagrams add ~3.0 KB, and inlined
CSS adds ~1.3 KB. That is 7.7 KB. A single S4 diagram is ~2.8 KB gz and a single A5
diagram ~6.9 KB gz, so one large-group page breaks the old budget with one figure.
The 1,462-byte current baseline is a single `index.astro` with no content
collection, no markdown pipeline and no diagrams. It is not a precedent.

```js
// astro.config.mjs
build: { inlineStylesheets: 'always' }
```

At this page size an external stylesheet costs more round-trip than the bytes it
saves.

```
# web/public/_headers
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## Needs Dave

Nobody else decides these.

**Money and accounts**

1. **Cloudflare account: personal or Inner Stack Labs.** That account controls DNS
   for neuralingual.com, a live business. Whichever you pick, the deploy uses a
   project-scoped API token.
2. **Domain: `cayley.lol` or `cayley.daveremy.com`.** The subdomain is free. The
   `.lol` costs money and can wait until the project earns its own name.
3. **GitHub Actions minutes for the contact sheets.** Scheduled plus
   palette-change-triggered should stay inside the free tier at 6 groups. It will
   not at 100.

No typeface costs anything. XCharter, XCharter Math and Monaspace Xenon are all
OFL.

**Product calls**

4. **Amend "colour never touches a glyph" to "colour is never a glyph's own
   colour"?** The second version still buys the whole WCAG argument and still stops
   coloured notation, but it permits a tinted cell behind a coset block in a
   multiplication table. Without the amendment, block structure has to work through
   rule weight and whitespace alone, which is specified above but untested at 24×24.
   Group Explorer's synchronised cross-view highlighting also needs an answer here.
5. **The register.** "A Charter-set technical monograph, printed rather than
   deployed" is at odds with a product that is a square you push around with two
   buttons. A monograph you operate is a real position, but it changes the button,
   the probe and the figure treatment. Cross-references are already restored because
   the parked/owed mechanism needs them.
6. **The font budget moved from 100 KB to 110 KB**, after cutting Bold and Xenon
   Italic and splitting the maths face. Say yes or cut further.

---

## Open questions

1. **Per-edge labels at order 24.** Every edge carries its generator letter, which
   on D₄ is 16 labels and on a group of order 24 is 48. Carter and Group Explorer
   both drop per-edge labels at that density. The claim that the label deletes the
   legend has never been rendered. Render test 1 decides whether this is a per-edge
   channel or a per-edge-class one, where only the first edge of each generator per
   node ring is labelled.
2. **The prose mirror's three unexpressible rhythms.** Dotted-round, long-dash and
   dash-dot need a `repeating-linear-gradient` background image, which does not
   follow descenders and does not wrap cleanly across a line break. Render test 2
   decides. Fallback is hue plus letter, and the dash rhythm becomes diagram-only.
3. **The code register's form of the signature.** A mono identifier cannot take an
   italic maths letter or a serif underline without becoming a fourth thing. Code is
   one of three co-equal registers and this is unspecified.
4. **XCharter Roman's x/cap ratio** is asserted at ~0.70 by analogy with Charis SIL
   and Erewhon. Only x/upm (0.481) is measured. Confirm with fontTools before the
   Monaspace pairing and the `font-size-adjust: ex-height 0.481` value are final.
   Confirm the web-buildable OTF carries `smcp`/`c2sc`/`onum`/`lnum`/`tnum`; the
   whole emphasis system depends on real small caps, and synthesised ones have
   visibly wrong stroke weights.
5. **Multiplication table block structure at 24×24.** The rule-weight-and-whitespace
   mechanism is specified and tested only against D₄'s 8×8.
6. **How many views are co-present.** Group Explorer's strongest idea is one group in
   four synchronised views with highlighting that fires in all of them at once, and
   the research on multiple representations says co-presence is what builds
   cross-representation links. Four views do not fit 38rem or even 59rem, and
   cross-view highlighting with no JavaScript is limited to what `:target` and
   `:has()` reach. The hidden multiplication table partly answers this — it is the
   diagram's text alternative, not a second view — but the visible question stands.
7. **iOS maths fallback**, on a real iPhone. Gates `font-display: block` on the maths
   faces.
8. **Whether XCharter Math's 577-symbol repertoire covers everything group theory
   needs.** If a symbol is missing, fall back to STIX Two Math plus STIX Two Text
   (x-heights identical by construction, 1256 symbols) and accept a more Times-ish,
   more academic register.
