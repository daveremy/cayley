// The front door.
//
//   npm run g -- list                    every group in the library
//   npm run g -- show C₅                 one group, in detail
//   npm run g -- table V₄                the multiplication table
//   npm run g -- mul C₅ a2 a3            one product
//   npm run g -- word C₅ a3              the path from the identity
//   npm run g -- diff C₄ V₄              two groups side by side
//
// Group names are alias-aware: "V₄", "Klein four-group", "the rectangle group"
// and "C₂ × C₂" all find the same object.

import { findGroup, loadLibrary } from "./load.ts";
import {
  allSelfInverse,
  isAbelian,
  multiply,
  printTable,
  squares,
  table,
  words,
} from "./group.ts";
import type { Group } from "./group.ts";

const [command, ...args] = process.argv.slice(2);

/** Look a group up, or exit with something readable. */
function need(name: string): Group {
  const g = findGroup(name);
  if (g) return g;
  console.error(`\nno group called "${name}".\n`);
  console.error("the library has:");
  for (const x of loadLibrary()) {
    console.error(`  ${x.name.padEnd(6)} ${(x.aliases ?? []).join(", ")}`);
  }
  console.error("");
  process.exit(1);
}

/** An element's order: how many times you press it to get home. */
function order(g: Group, x: string): number {
  let n = 1;
  let cur = x;
  while (cur !== g.identity) {
    cur = multiply(g, cur, x);
    n++;
  }
  return n;
}

function describe(g: Group): void {
  console.log(`\n${g.name}`);
  if (g.aliases?.length) console.log(`  also called   ${g.aliases.join(", ")}`);
  console.log(`  order         ${g.elements.length}`);
  console.log(`  elements      ${g.elements.join(", ")}`);
  console.log(`  identity      ${g.identity}`);
  console.log(`  generators    ${g.generators.join(", ")}   (${g.generators.length} needed)`);
  console.log(`  abelian       ${isAbelian(g)}`);
  console.log(`  all self-inverse  ${allSelfInverse(g)}`);
  console.log(`  element orders    ${g.elements.map((x) => `${x}:${order(g, x)}`).join("  ")}`);
  console.log(`  words         ${[...words(g)].map(([e, w]) => `${e}=${w.join("·") || "(e)"}`).join("  ")}`);
  if (g.notes) console.log(`\n  ${g.notes}`);
  console.log("");
}

switch (command) {
  case "list": {
    console.log("");
    for (const g of loadLibrary()) {
      console.log(
        `  ${g.name.padEnd(5)} order ${String(g.elements.length).padEnd(3)} ` +
          `${isAbelian(g) ? "abelian    " : "non-abelian"}  ${(g.aliases ?? []).slice(0, 3).join(", ")}`,
      );
    }
    console.log("");
    break;
  }

  case "show":
    describe(need(args[0]));
    break;

  case "table":
    printTable(need(args[0]));
    console.log("");
    break;

  case "mul": {
    const g = need(args[0]);
    const [x, y] = args.slice(1);
    const path = words(g).get(y);
    console.log(`\n  ${x} · ${y} = ${multiply(g, x, y)}`);
    console.log(`  (start at ${x}, follow ${path?.length === 0 ? "no arrows" : path?.join(" then ")})\n`);
    break;
  }

  case "word": {
    const g = need(args[0]);
    const w = words(g).get(args[1]);
    console.log(`\n  ${args[1]} = ${w?.join(" · ") || "(the empty path — it IS the identity)"}\n`);
    break;
  }

  case "diff": {
    const a = need(args[0]);
    const b = need(args[1]);
    console.log(`\n  ${"".padEnd(24)}${a.name.padEnd(14)}${b.name}`);
    const row = (label: string, l: unknown, r: unknown) =>
      console.log(`  ${label.padEnd(24)}${String(l).padEnd(14)}${String(r)}`);
    row("order", a.elements.length, b.elements.length);
    row("generators needed", a.generators.length, b.generators.length);
    row("abelian", isAbelian(a), isAbelian(b));
    row("all self-inverse", allSelfInverse(a), allSelfInverse(b));
    row("largest element order", Math.max(...a.elements.map((x) => order(a, x))), Math.max(...b.elements.map((x) => order(b, x))));
    console.log(`\n  diagonals (every element squared):`);
    console.log(`    ${a.name}  ${Object.entries(squares(a)).map(([k, v]) => `${k}²=${v}`).join("  ")}`);
    console.log(`    ${b.name}  ${Object.entries(squares(b)).map(([k, v]) => `${k}²=${v}`).join("  ")}\n`);
    break;
  }

  default:
    console.log(`
  npm run g -- list                 every group in the library
  npm run g -- show C₅              one group, in detail
  npm run g -- table V₄             the multiplication table
  npm run g -- mul C₅ a2 a3         one product, and the path walked
  npm run g -- word C₅ a3           an element's path from the identity
  npm run g -- diff C₄ V₄           two groups side by side

  names are alias-aware — "V₄", "Klein four-group", "the rectangle group"
  and "C₂ × C₂" all find the same group.
`);
}
