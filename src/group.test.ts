// Run:  npm test
//
// Four layers, cheapest and most general first:
//
//   1. axioms      — must hold for EVERY group we define
//   2. ground truth — C₅ against the table Dave built by hand
//   3. properties  — things that distinguish one group from another
//   4. words       — Def 4.1, the paths themselves
//
// Layer 1 is the important one: it runs against every group in the list, so
// adding a new group automatically subjects it to the group axioms. Get an
// arrow wrong while defining Q₈ and these fail before you can build on it.

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { C4, C5, V4 } from "./groups.ts";
import {
  allSelfInverse,
  everyElementHasInverse,
  identityWorks,
  isAbelian,
  isAssociative,
  isClosed,
  isLatinSquare,
  multiply,
  squares,
  table,
  words,
} from "./group.ts";
import type { Group } from "./group.ts";

/** Every group defined in groups.ts. Add new ones here and they get audited. */
const ALL: Group[] = [C5, C4, V4];

// ── Layer 1: the axioms ──────────────────────────────────────────────────────

describe("group axioms — hold for every defined group", () => {
  for (const g of ALL) {
    describe(g.name, () => {
      test("closed: every product stays in the set", () => {
        assert.ok(isClosed(g));
      });

      test("identity does nothing, from either side", () => {
        assert.ok(identityWorks(g));
      });

      test("every element has an inverse", () => {
        assert.ok(everyElementHasInverse(g));
      });

      test("associative: (x·y)·z === x·(y·z)", () => {
        assert.ok(isAssociative(g));
      });

      test("Latin square — a consequence of inverses, not a separate fact", () => {
        assert.ok(isLatinSquare(g));
      });

      test("the identity's word is empty — it is zero steps from itself", () => {
        assert.deepEqual(words(g).get(g.identity), []);
      });

      test("every element is reachable from the identity", () => {
        const w = words(g);
        for (const e of g.elements) assert.ok(w.has(e), `${e} unreachable`);
      });
    });
  }
});

// ── Layer 2: ground truth ────────────────────────────────────────────────────

describe("C₅ against the hand-built table", () => {
  // Built in Google Sheets, 2026-07-26, verified cell by cell.
  // Rows and columns both run e, a, a², a³, a⁴.
  const HAND_BUILT = [
    ["e", "a", "a2", "a3", "a4"],
    ["a", "a2", "a3", "a4", "e"],
    ["a2", "a3", "a4", "e", "a"],
    ["a3", "a4", "e", "a", "a2"],
    ["a4", "e", "a", "a2", "a3"],
  ];

  const t = table(C5);

  C5.elements.forEach((row, ri) => {
    C5.elements.forEach((col, ci) => {
      test(`${row} · ${col} = ${HAND_BUILT[ri][ci]}`, () => {
        assert.equal(t[row][col], HAND_BUILT[ri][ci]);
      });
    });
  });
});

// ── Layer 3: properties that tell groups apart ───────────────────────────────

describe("V₄ vs C₄ — same size, different shape", () => {
  test("both have four elements", () => {
    assert.equal(V4.elements.length, 4);
    assert.equal(C4.elements.length, 4);
  });

  test("both abelian, so that is NOT what distinguishes them", () => {
    assert.ok(isAbelian(V4));
    assert.ok(isAbelian(C4));
  });

  test("V₄: every element is its own inverse — diagonal is all identity", () => {
    assert.ok(allSelfInverse(V4));
    assert.deepEqual(squares(V4), { N: "N", R: "N", B: "N", RB: "N" });
  });

  test("C₄: not all self-inverse — r² is not the identity", () => {
    assert.ok(!allSelfInverse(C4));
    assert.deepEqual(squares(C4), { e: "e", r: "r2", r2: "e", r3: "r2" });
  });

  test("C₄ has an element of order 4; V₄ has none", () => {
    const order = (g: Group, x: string) => {
      let n = 1;
      let cur = x;
      while (cur !== g.identity) {
        cur = multiply(g, cur, x);
        n++;
      }
      return n;
    };
    assert.equal(order(C4, "r"), 4);
    assert.deepEqual(
      V4.elements.map((x) => order(V4, x)),
      [1, 2, 2, 2],
    );
  });

  test("one generator suffices for C₄; V₄ needs two", () => {
    assert.equal(C4.generators.length, 1);
    assert.equal(V4.generators.length, 2);
  });
});

// ── Layer 4: words — Definition 4.1 ──────────────────────────────────────────

describe("words are paths from the identity", () => {
  test("C₅: a³ is three a-steps", () => {
    assert.deepEqual(words(C5).get("a3"), ["a", "a", "a"]);
  });

  test("V₄: RB really is R then B — derived from arrows, not from its name", () => {
    assert.deepEqual(words(V4).get("RB"), ["R", "B"]);
  });

  test("walking an element's word from the identity lands on that element", () => {
    for (const g of ALL) {
      for (const [element, path] of words(g)) {
        let here = g.identity;
        for (const gen of path) here = g.arrows[gen][here];
        assert.equal(here, element, `${g.name}: word for ${element} goes astray`);
      }
    }
  });

  test("multiplying by the identity walks zero arrows", () => {
    for (const g of ALL) {
      for (const x of g.elements) assert.equal(multiply(g, x, g.identity), x);
    }
  });
});
