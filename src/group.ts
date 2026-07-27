// The engine. A group is stored exactly the way a Cayley diagram stores one:
// a set of nodes, plus one arrow-map per generator.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE CONVENTION, STATED ONCE, IN PUBLIC
//
// Every arrow in this codebase is RIGHT multiplication:
//
//     arrows[g][x] === "x · g"      (start at x, follow the g-arrow)
//
// This is the thing that cost us an hour on Carter's Q₄ diagram — a printed
// arrowhead can't tell you whether it means x·g or g·x, and the two give
// different answers in a non-abelian group. Here it is a line of code.
// ─────────────────────────────────────────────────────────────────────────────

export type Group = {
  name: string;
  elements: string[];                             // node labels
  identity: string;
  generators: string[];                           // the "buttons"
  arrows: Record<string, Record<string, string>>; // arrows[gen][from] = to
};

/**
 * Give every element a WORD: the sequence of generators that walks from the
 * identity to that element. This is Carter's Definition 4.1 — "relabel each
 * node with a path that leads there from the start" — as code.
 *
 * Breadth-first, so each word is the shortest one.
 */
export function words(g: Group): Map<string, string[]> {
  const found = new Map<string, string[]>([[g.identity, []]]);
  const queue: string[] = [g.identity];

  while (queue.length) {
    const from = queue.shift()!;
    for (const gen of g.generators) {
      const to = g.arrows[gen]?.[from];
      if (to === undefined) throw new Error(`${g.name}: no ${gen}-arrow out of ${from}`);
      if (!found.has(to)) {
        found.set(to, [...found.get(from)!, gen]);
        queue.push(to);
      }
    }
  }
  return found;
}

/**
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  YOUR TURN.                                                               │
 * │                                                                           │
 * │  Compute x · y using ONLY the arrows. No arithmetic, no special cases.    │
 * │                                                                           │
 * │  The whole idea in one sentence:                                          │
 * │      y names a path from the identity — so walk that same path,           │
 * │      but start at x instead.                                              │
 * │                                                                           │
 * │  You have `words(g)` above, which hands you the path for any element.     │
 * │  Three or four lines. Delete the throw when you write it.                 │
 * └───────────────────────────────────────────────────────────────────────────┘
 */
export function multiply(g: Group, x: string, y: string): string {
  const path = words(g).get(y);                      // y's route from the identity
  if (path === undefined) throw new Error(`${g.name}: ${y} is not an element`);

  let here = x;                                      // but start from x
  for (const gen of path) here = g.arrows[gen][here]; // walk it, one arrow at a time
  return here;                                       // wherever you stop IS the product
}

/** Full multiplication table. table[row][col] = row · col */
export function table(g: Group): Record<string, Record<string, string>> {
  const t: Record<string, Record<string, string>> = {};
  for (const row of g.elements) {
    t[row] = {};
    for (const col of g.elements) t[row][col] = multiply(g, row, col);
  }
  return t;
}

/** Print a table you can eyeball against a hand-built one. */
export function printTable(g: Group): void {
  const t = table(g);
  const w = Math.max(...g.elements.map((e) => e.length)) + 2;
  const cell = (s: string) => s.padEnd(w);

  console.log(`\n${g.name}`);
  console.log(cell("·") + g.elements.map(cell).join(""));
  for (const row of g.elements) {
    console.log(cell(row) + g.elements.map((col) => cell(t[row][col])).join(""));
  }
}

// ── Structural checks. These are theorems, running as assertions. ────────────

/** Every element appears exactly once per row and per column. */
export function isLatinSquare(g: Group): boolean {
  const t = table(g);
  const complete = (xs: string[]) => new Set(xs).size === g.elements.length;

  return g.elements.every(
    (row) =>
      complete(g.elements.map((col) => t[row][col])) &&
      complete(g.elements.map((col) => t[col][row])),
  );
}

/** Does x·y === y·x for every pair? */
export function isAbelian(g: Group): boolean {
  const t = table(g);
  return g.elements.every((x) => g.elements.every((y) => t[x][y] === t[y][x]));
}

/** Sanity: the identity really does nothing, from both sides. */
export function identityWorks(g: Group): boolean {
  const t = table(g);
  return g.elements.every((x) => t[x][g.identity] === x && t[g.identity][x] === x);
}

/** Every element has something that undoes it. */
export function everyElementHasInverse(g: Group): boolean {
  const t = table(g);
  return g.elements.every((x) => g.elements.some((y) => t[x][y] === g.identity));
}
