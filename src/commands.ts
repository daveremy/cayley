// The command layer: input → data. No printing, no process.exit, no formatting.
//
// This is the whole reason a CLI can later become an HTTP API or an MCP server
// without a rewrite. Every function here returns a plain object; cli.ts formats
// it, a future request handler would serialise it, a future MCP tool would
// return it. None of those would contain any mathematics.
//
// It is also what makes the CLI testable. These are pure functions over the
// library — assert on the returned object, no spawning, no scraping stdout.
//
// The returned shapes ARE the --json output, and therefore the future API
// response bodies. Changing one changes all three.

import { findGroup, loadLibrary, loadGroup } from "./load.ts";
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
import type { Element, Group } from "./group.ts";
import { UnknownElementError, UnknownGroupError } from "./errors.ts";

// ── lookup helpers ───────────────────────────────────────────────────────────

/** Resolve a group name, or say what is available. */
function need(name: string): Group {
  const g = findGroup(name);
  if (g) return g;
  throw new UnknownGroupError(
    name,
    loadLibrary().flatMap((x) => [x.name, ...(x.aliases ?? [])]),
  );
}

/** Confirm an element belongs to a group before using it. */
function needElement(g: Group, x: Element): Element {
  if (!g.elements.includes(x)) throw new UnknownElementError(x, g.name, g.elements);
  return x;
}

/** How many times you apply an element before returning to the identity. */
export function order(g: Group, x: Element): number {
  let n = 1;
  let cur = x;
  while (cur !== g.identity) {
    cur = multiply(g, cur, x);
    n++;
  }
  return n;
}

// ── returned shapes ──────────────────────────────────────────────────────────

export type Summary = {
  name: string;
  aliases: string[];
  order: number;
  generators: string[];
  abelian: boolean;
  allSelfInverse: boolean;
};

export type Detail = Summary & {
  elements: string[];
  identity: string;
  elementOrders: Record<string, number>;
  squares: Record<string, string>;
  words: Record<string, string[]>;
  properties: {
    closed: boolean;
    identityWorks: boolean;
    everyElementHasInverse: boolean;
    associative: boolean;
    latinSquare: boolean;
    abelian: boolean;
  };
  notes?: string;
  source?: string;
};

// ── commands ─────────────────────────────────────────────────────────────────

function summarise(g: Group): Summary {
  return {
    name: g.name,
    aliases: g.aliases ?? [],
    order: g.elements.length,
    generators: [...g.generators],
    abelian: isAbelian(g),
    allSelfInverse: allSelfInverse(g),
  };
}

/** Every group in the library. */
export function list(): { groups: Summary[] } {
  return { groups: loadLibrary().map(summarise) };
}

/**
 * One group, exhaustively.
 *
 * Exhaustive on purpose: this shape is the API response, and a caller who has to
 * make four requests to assemble one picture has been given a bad API. It is
 * cheap because table() and words() are memoised per group.
 */
export function show(name: string): Detail {
  const g = need(name);
  return {
    ...summarise(g),
    elements: [...g.elements],
    identity: g.identity,
    elementOrders: Object.fromEntries(g.elements.map((x) => [x, order(g, x)])),
    squares: squares(g),
    words: Object.fromEntries([...words(g)].map(([e, w]) => [e, w])),
    properties: {
      closed: isClosed(g),
      identityWorks: identityWorks(g),
      everyElementHasInverse: everyElementHasInverse(g),
      associative: isAssociative(g),
      latinSquare: isLatinSquare(g),
      abelian: isAbelian(g),
    },
    ...(g.notes ? { notes: g.notes } : {}),
    ...(g.source ? { source: g.source } : {}),
  };
}

/** The multiplication table, with its row/column ordering made explicit. */
export function tableOf(name: string): {
  name: string;
  elements: string[];
  rows: Record<string, Record<string, string>>;
} {
  const g = need(name);
  return { name: g.name, elements: [...g.elements], rows: table(g) };
}

/**
 * One product — and the path walked to get it.
 *
 * The path is not decoration. It is the mechanic: y names a route from the
 * identity, and x·y walks that route starting from x instead. Returning it keeps
 * the diagram visible in the answer.
 */
export function mul(name: string, x: string, y: string): {
  group: string;
  x: string;
  y: string;
  product: string;
  path: string[];
} {
  const g = need(name);
  needElement(g, x);
  needElement(g, y);
  return {
    group: g.name,
    x,
    y,
    product: multiply(g, x, y),
    path: words(g).get(y) ?? [],
  };
}

/** An element's path from the identity — Carter's Definition 4.1. */
export function word(name: string, element: string): {
  group: string;
  element: string;
  path: string[];
  isIdentity: boolean;
} {
  const g = need(name);
  needElement(g, element);
  const path = words(g).get(element) ?? [];
  return { group: g.name, element, path, isIdentity: element === g.identity };
}

/** Element orders — one element, or all of them. */
export function orders(name: string, element?: string): {
  group: string;
  orders: Record<string, number>;
} {
  const g = need(name);
  const wanted = element ? [needElement(g, element)] : g.elements;
  return { group: g.name, orders: Object.fromEntries(wanted.map((x) => [x, order(g, x)])) };
}

/**
 * Two groups side by side.
 *
 * `sameOrder` and `distinguishedBy` are the point: two groups of the same size
 * are not the same group, and this names what actually separates them.
 */
export function diff(a: string, b: string): {
  a: Summary & { largestElementOrder: number; squares: Record<string, string> };
  b: Summary & { largestElementOrder: number; squares: Record<string, string> };
  sameOrder: boolean;
  distinguishedBy: string[];
} {
  const ga = need(a);
  const gb = need(b);
  const decorate = (g: Group) => ({
    ...summarise(g),
    largestElementOrder: Math.max(...g.elements.map((x) => order(g, x))),
    squares: squares(g),
  });
  const da = decorate(ga);
  const db = decorate(gb);

  const distinguishedBy: string[] = [];
  if (da.order !== db.order) distinguishedBy.push("order");
  if (da.abelian !== db.abelian) distinguishedBy.push("abelian");
  if (da.allSelfInverse !== db.allSelfInverse) distinguishedBy.push("all elements self-inverse");
  if (da.largestElementOrder !== db.largestElementOrder) distinguishedBy.push("largest element order");
  if (da.generators.length !== db.generators.length) distinguishedBy.push("generators needed");

  return { a: da, b: db, sameOrder: da.order === db.order, distinguishedBy };
}

/** Validate a file. Throws GroupValidationError if it is not a group. */
export function check(path: string): Detail & { file: string; valid: true } {
  const g = loadGroup(path);
  // reuse show()'s shape by describing the loaded group directly
  const detail: Detail = {
    ...summarise(g),
    elements: [...g.elements],
    identity: g.identity,
    elementOrders: Object.fromEntries(g.elements.map((x) => [x, order(g, x)])),
    squares: squares(g),
    words: Object.fromEntries([...words(g)].map(([e, w]) => [e, w])),
    properties: {
      closed: isClosed(g),
      identityWorks: identityWorks(g),
      everyElementHasInverse: everyElementHasInverse(g),
      associative: isAssociative(g),
      latinSquare: isLatinSquare(g),
      abelian: isAbelian(g),
    },
    ...(g.notes ? { notes: g.notes } : {}),
    ...(g.source ? { source: g.source } : {}),
  };
  return { ...detail, file: path, valid: true };
}

/** Every command, for the invariant tests and for --help. */
export const COMMANDS = ["list", "show", "table", "mul", "word", "order", "diff", "check"] as const;
export type CommandName = (typeof COMMANDS)[number];
