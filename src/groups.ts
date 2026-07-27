// Group definitions. Each one is just: nodes, plus where each generator-arrow
// points. Exactly what a Cayley diagram draws — no algebra imported.
//
// Reminder: arrows[gen][x] means "x · gen".

import type { Group } from "./group.ts";

/**
 * C₅ — the cyclic group of order 5. One generator, one ring.
 * This is the one Dave built by hand in a spreadsheet on 2026-07-26;
 * that table is our ground truth.
 */
export const C5: Group = {
  name: "C₅  (cyclic, order 5)",
  elements: ["e", "a", "a2", "a3", "a4"],
  identity: "e",
  generators: ["a"],
  arrows: {
    a: { e: "a", a: "a2", a2: "a3", a3: "a4", a4: "e" },
  },
};

/**
 * V₄ — the Klein four-group. The rectangle's symmetries.
 * Two switches: R = flip left↔right, B = flip top↕bottom, RB = both = turn 180°.
 * Every element is its own inverse, which you can see in the arrows:
 * each one points back where it came from.
 */
export const V4: Group = {
  name: "V₄  (Klein four — the rectangle)",
  elements: ["N", "R", "B", "RB"],
  identity: "N",
  generators: ["R", "B"],
  arrows: {
    R: { N: "R", R: "N", B: "RB", RB: "B" },
    B: { N: "B", B: "N", R: "RB", RB: "R" },
  },
};

/**
 * C₄ — the square's rotations. One generator, order 4.
 * Same size as V₄, different shape. Run both and compare the tables.
 */
export const C4: Group = {
  name: "C₄  (cyclic, order 4 — rotations of a square)",
  elements: ["e", "r", "r2", "r3"],
  identity: "e",
  generators: ["r"],
  arrows: {
    r: { e: "r", r: "r2", r2: "r3", r3: "e" },
  },
};

/**
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  Q₄ / Q₈ — the quaternion group. YOURS TO FILL IN.                        │
 * │                                                                           │
 * │  Eight elements: 1, i, j, k, -1, -i, -j, -k.                              │
 * │  Two generators: i and j.                                                 │
 * │                                                                           │
 * │  You need arrows.i[x] = "x · i" for all eight x, and the same for j.      │
 * │                                                                           │
 * │  You already worked out the shape of this yourself — the red cycles are   │
 * │      1 → i → i² → i³ → 1        and        j → ji → ji² → ji³ → j        │
 * │  so you know the arrows land in two 4-cycles, not one 8-cycle.            │
 * │                                                                           │
 * │  The facts you need, stated once so there is no arrowhead to squint at:   │
 * │      i² = j² = k² = -1                                                    │
 * │      i·j = k      j·k = i      k·i = j                                    │
 * │      j·i = -k     k·j = -i     i·k = -j                                   │
 * │      -1 commutes with everything, and (-1)² = 1                           │
 * │                                                                           │
 * │  Fill in the arrows from those. Then the checks below will tell you       │
 * │  whether you got it right — a wrong arrow breaks the Latin square.        │
 * └───────────────────────────────────────────────────────────────────────────┘
 */
export const Q8: Group = {
  name: "Q₈  (quaternion group)",
  elements: ["1", "i", "j", "k", "-1", "-i", "-j", "-k"],
  identity: "1",
  generators: ["i", "j"],
  arrows: {
    // x · i  — fill in all eight
    i: { "1": "i" /* , i: "?", j: "?", k: "?", "-1": "?", "-i": "?", "-j": "?", "-k": "?" */ },
    // x · j  — fill in all eight
    j: { "1": "j" /* , ... */ },
  },
};
