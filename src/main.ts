// Run:  npm start
//
// Until multiply() is written this fails loudly, which is the point.

import { C4, C5, V4 } from "./groups.ts";
import {
  everyElementHasInverse,
  identityWorks,
  isAbelian,
  isLatinSquare,
  printTable,
  table,
  words,
} from "./group.ts";
import type { Group } from "./group.ts";

/**
 * Dave's hand-built C₅ table, 2026-07-26, verified cell by cell.
 * Rows and columns both run e, a, a², a³, a⁴.
 * The program has to reproduce this exactly or the mechanic is wrong.
 */
const HAND_BUILT_C5 = [
  ["e", "a", "a2", "a3", "a4"],
  ["a", "a2", "a3", "a4", "e"],
  ["a2", "a3", "a4", "e", "a"],
  ["a3", "a4", "e", "a", "a2"],
  ["a4", "e", "a", "a2", "a3"],
];

function checkAgainstHandBuilt(): void {
  const t = table(C5);
  const wrong: string[] = [];

  C5.elements.forEach((row, ri) => {
    C5.elements.forEach((col, ci) => {
      const got = t[row][col];
      const want = HAND_BUILT_C5[ri][ci];
      if (got !== want) wrong.push(`  ${row} · ${col} → got ${got}, hand-built says ${want}`);
    });
  });

  console.log("\nC₅ vs the spreadsheet");
  if (wrong.length === 0) {
    console.log("  all 25 cells agree ✓");
  } else {
    console.log(`  ${wrong.length} disagreement(s):`);
    wrong.forEach((w) => console.log(w));
  }
}

function report(g: Group): void {
  printTable(g);
  console.log("  words:", [...words(g)].map(([e, w]) => `${e}=${w.join("·") || "(empty)"}`).join("  "));
  console.log("  identity behaves ....", identityWorks(g));
  console.log("  all have inverses ...", everyElementHasInverse(g));
  console.log("  Latin square ........", isLatinSquare(g));
  console.log("  abelian .............", isAbelian(g));
}

for (const g of [C5, C4, V4]) report(g);
checkAgainstHandBuilt();

console.log(`
Two things to look at once this runs:

  · C₄ and V₄ both have four elements. Put their tables side by side.
    Same size, and you can see they are not the same object.

  · Latin square comes out true for every group here. It is not a
    coincidence and it is not per-group — it follows from inverses
    existing. That is the argument still open from Sunday night.
`);
