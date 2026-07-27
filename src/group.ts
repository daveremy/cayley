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

// ── The vocabulary ───────────────────────────────────────────────────────────
// Each alias below names one idea. None of them add runtime safety — they are
// all `string` underneath — but each one states what kind of thing is meant.

/** A member of the group. A node on the diagram. Just a label: "a2", "RB", "-k". */
export type Element = string;

/**
 * An element chosen to be a button — one of the arrow colours on the diagram.
 *
 * Deliberately an ALIAS, not a distinct type. A generator IS an element; being
 * a generator is a role it plays, not a species it belongs to. Branding this
 * so the compiler kept them apart would encode something false about groups.
 */
export type Generator = Element;

/** A route through the diagram: a sequence of generator-steps. */
export type Word = Generator[];

/** One generator's arrows — where it sends every node. arrowMap[from] = to */
export type ArrowMap = Record<Element, Element>;

/** Every element's canonical route from the identity. */
export type Words = Map<Element, Word>;

/** A filled multiplication table. table[row][col] = row · col */
export type Table = Record<Element, Record<Element, Element>>;

/**
 * A group, stored as a Cayley diagram — nothing more.
 *
 * Note what is absent: no multiplication table, no operation, no algebra.
 * The arrows are a compression of the table; everything else is derived.
 * C₅ is 5 arrows and yields 25 cells.
 */
export type Group = {
  name: string;
  elements: Element[];
  identity: Element;
  generators: Generator[];
  arrows: Record<Generator, ArrowMap>;
};

// ── Derived structure ────────────────────────────────────────────────────────

/**
 * Give every element a WORD: the sequence of generators that walks from the
 * identity to that element. This is Carter's Definition 4.1 — "relabel each
 * node with a path that leads there from the start" — as code.
 *
 * Breadth-first, so each word is the shortest one.
 */
export function words(g: Group): Words {
  const found: Words = new Map([[g.identity, []]]);
  const queue: Element[] = [g.identity];

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
 * x · y, computed from arrows alone.
 *
 * y names a route from the identity — so walk that same route, but start at x.
 */
export function multiply(g: Group, x: Element, y: Element): Element {
  const path = words(g).get(y);
  if (path === undefined) throw new Error(`${g.name}: ${y} is not an element`);

  let here: Element = x;
  for (const gen of path) here = g.arrows[gen][here];
  return here;
}

/** Every product, for every ordered pair. */
export function table(g: Group): Table {
  const t: Table = {};
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
  const complete = (xs: Element[]) => new Set(xs).size === g.elements.length;

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
