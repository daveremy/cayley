// Reading groups from files, and refusing to hand back anything that isn't one.
//
// ─────────────────────────────────────────────────────────────────────────────
// TWO KINDS OF WRONG, TWO MECHANISMS
//
//   shape  →  schema/group.schema.json  →  caught in the editor, while typing
//   laws   →  this file                 →  caught at load
//
// JSON Schema cannot say "arrows.i must be a bijection" or "the operation must
// be associative". A file can satisfy the schema completely and still not be a
// group. So the schema exists for VS Code's red squiggles — an authoring aid for
// someone who doesn't compile — and every mathematical claim is checked here.
//
// This is also why there is no ajv dependency: the runtime shape check below is
// hand-rolled, so its failures speak group theory rather than JSON.
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { table, words } from "./group.ts";
import type { Element, Generator, Group, Permutation } from "./group.ts";
import {
  AmbiguousNameError,
  GroupValidationError,
  LibraryValidationError,
  type Issue,
} from "./errors.ts";

// Re-exported so existing importers keep working; they are defined in errors.ts
// because load.ts and commands.ts both need them and neither may depend on the
// other. See the comment at the top of errors.ts.
export { AmbiguousNameError, GroupValidationError, LibraryValidationError };
export type { Issue };

const q = (s: string) => JSON.stringify(s);
const list = (xs: string[]) => xs.map(q).join(", ");

// ── Phase 2: shape ───────────────────────────────────────────────────────────

function checkShape(data: unknown): Issue[] {
  const bad = (message: string): Issue[] => [{ phase: 2, message }];

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return bad("top level is not a JSON object");
  }
  const d = data as Record<string, unknown>;
  const issues: Issue[] = [];

  const strArray = (field: string) => {
    const v = d[field];
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) {
      issues.push({ phase: 2, message: `${field} must be an array of strings` });
      return false;
    }
    if (v.length === 0) {
      issues.push({ phase: 2, message: `${field} is empty` });
      return false;
    }
    return true;
  };

  for (const field of ["name", "identity"]) {
    if (typeof d[field] !== "string" || !d[field]) {
      issues.push({ phase: 2, message: `${field} must be a non-empty string` });
    }
  }
  strArray("elements");
  if (strArray("generators")) {
    const gens = d.generators as string[];
    const dupes = gens.filter((x, i) => gens.indexOf(x) !== i);
    if (dupes.length) {
      issues.push({
        phase: 2,
        message: `generators lists ${list([...new Set(dupes)])} more than once — each generator is one arrow colour, named once`,
      });
    }
  }

  // Optional metadata. Unvalidated metadata is still a crash waiting to happen:
  // `"aliases": "Z4"` would sail through and then blow up in findGroup() with a
  // TypeError instead of a validation message. The loader must not depend on the
  // editor-only schema having been honoured.
  if (d.aliases !== undefined && (!Array.isArray(d.aliases) || d.aliases.some((x) => typeof x !== "string"))) {
    issues.push({
      phase: 2,
      message: `aliases must be an array of strings — e.g. ["Klein four-group", "C₂ × C₂"] — not ${typeof d.aliases}`,
    });
  }
  for (const field of ["notes", "source"]) {
    if (d[field] !== undefined && typeof d[field] !== "string") {
      issues.push({ phase: 2, message: `${field} must be a string if present` });
    }
  }

  // Catch typo'd field names. A misspelled "generator" or "alises" would
  // otherwise be silently ignored, and the author would be left wondering why
  // their edit had no effect. The JSON Schema sets additionalProperties: false;
  // this keeps the runtime honest about the same rule.
  const known = new Set(["$schema", "name", "aliases", "elements", "identity", "generators", "arrows", "notes", "source"]);
  const unknown = Object.keys(d).filter((k) => !known.has(k));
  if (unknown.length) {
    issues.push({ phase: 2, message: `unknown field(s): ${list(unknown)} — check the spelling against schema/group.schema.json` });
  }

  if (typeof d.arrows !== "object" || d.arrows === null || Array.isArray(d.arrows)) {
    issues.push({ phase: 2, message: "arrows must be an object keyed by generator" });
  } else {
    for (const [gen, map] of Object.entries(d.arrows as Record<string, unknown>)) {
      if (typeof map !== "object" || map === null || Array.isArray(map)) {
        issues.push({ phase: 2, message: `arrows.${gen} must be an object mapping node → node` });
        continue;
      }
      for (const [from, to] of Object.entries(map as Record<string, unknown>)) {
        if (typeof to !== "string" || !to) {
          issues.push({ phase: 2, message: `arrows.${gen}[${q(from)}] must be a non-empty string` });
        }
      }
    }
  }
  return issues;
}

// ── Phase 3: domain shape ────────────────────────────────────────────────────

function checkDomainShape(g: Group): Issue[] {
  const issues: Issue[] = [];
  const add = (message: string) => issues.push({ phase: 3, message });
  const inGroup = new Set(g.elements);

  const dupes = g.elements.filter((e, i) => g.elements.indexOf(e) !== i);
  if (dupes.length) add(`elements contains duplicates: ${list([...new Set(dupes)])}`);

  if (!inGroup.has(g.identity)) {
    add(`identity ${q(g.identity)} is not one of the elements — the identity is a member, not a separate thing`);
  }

  for (const gen of g.generators) {
    if (!inGroup.has(gen)) {
      add(`generator ${q(gen)} is not an element — a generator IS an element, chosen as an arrow colour`);
    }
  }

  const declared = new Set(g.generators);
  for (const gen of Object.keys(g.arrows)) {
    if (!declared.has(gen)) add(`arrows has a map for ${q(gen)}, which is not listed in generators`);
  }

  for (const gen of g.generators) {
    const map: Permutation | undefined = g.arrows[gen];
    if (!map) {
      add(`generator ${q(gen)} has no arrows at all`);
      continue;
    }

    // total: every node needs an arrow out
    const missing = g.elements.filter((e) => map[e] === undefined);
    if (missing.length) {
      add(`generator ${q(gen)} has no arrow out of ${list(missing)} — every node needs one arrow of each colour leaving it`);
    }

    // targets must exist
    for (const [from, to] of Object.entries(map)) {
      if (!inGroup.has(from)) add(`arrows.${gen} has an entry for ${q(from)}, which is not an element`);
      else if (!inGroup.has(to)) add(`arrows.${gen}[${q(from)}] points at ${q(to)}, which is not an element`);
    }

    // bijective: it must be a permutation of the nodes
    const targets = g.elements.map((e) => map[e]).filter((t) => t !== undefined);
    const seen = new Map<Element, Element[]>();
    g.elements.forEach((from) => {
      const to = map[from];
      if (to === undefined) return;
      seen.set(to, [...(seen.get(to) ?? []), from]);
    });
    for (const [to, froms] of seen) {
      if (froms.length > 1) {
        add(`arrows.${gen} is not a permutation — ${list(froms)} all map to ${q(to)}, so something else is unreachable`);
      }
    }
    if (missing.length === 0 && targets.length === g.elements.length) {
      const unhit = g.elements.filter((e) => !seen.has(e));
      if (unhit.length) add(`arrows.${gen} never lands on ${list(unhit)} — not a permutation`);
    }

    // ⚑ THE LABELLING LAW.
    // Without this a file can label an arrow "i" while that arrow performs "j":
    // every group law still passes, and every table cell is wrong relative to the
    // names on the page. It holds because e·g = g — the identity is the one node
    // where "where I arrive" and "what I multiplied by" coincide.
    const fromIdentity = map[g.identity];
    if (fromIdentity !== undefined && fromIdentity !== gen) {
      add(
        `arrows.${gen} leaves the identity ${q(g.identity)} and lands on ${q(fromIdentity)}, not ${q(gen)}. ` +
          `An arrow labelled ${gen} means "multiply by ${gen}", so from the identity it must land on ${gen}`,
      );
    }
  }
  return issues;
}

// ── Phase 4: reachability ────────────────────────────────────────────────────

function checkReachability(g: Group): Issue[] {
  const reached = words(g);
  const unreachable = g.elements.filter((e) => !reached.has(e));
  return unreachable.length
    ? [{
        phase: 4,
        message: `generators [${list(g.generators)}] do not reach ${list(unreachable)} — they do not generate the group`,
      }]
    : [];
}

// ── Phase 5: the group laws ──────────────────────────────────────────────────

function checkLaws(g: Group): Issue[] {
  const issues: Issue[] = [];
  const add = (message: string) => issues.push({ phase: 5, message });
  const t = table(g);
  const inGroup = new Set(g.elements);

  for (const x of g.elements) {
    for (const y of g.elements) {
      if (!inGroup.has(t[x][y])) add(`not closed — ${x} · ${y} = ${q(t[x][y])}, which is outside the group`);
    }
  }

  for (const x of g.elements) {
    if (t[x][g.identity] !== x) add(`identity fails — ${x} · ${g.identity} = ${q(t[x][g.identity])}, expected ${q(x)}`);
    if (t[g.identity][x] !== x) add(`identity fails — ${g.identity} · ${x} = ${q(t[g.identity][x])}, expected ${q(x)}`);
  }

  for (const x of g.elements) {
    if (!g.elements.some((y) => t[x][y] === g.identity)) add(`${q(x)} has no inverse — nothing undoes it`);
  }

  outer: for (const x of g.elements) {
    for (const y of g.elements) {
      for (const z of g.elements) {
        if (t[t[x][y]][z] !== t[x][t[y][z]]) {
          add(`not associative — (${x}·${y})·${z} = ${q(t[t[x][y]][z])} but ${x}·(${y}·${z}) = ${q(t[x][t[y][z]])}`);
          break outer; // one example is enough; more would be noise
        }
      }
    }
  }
  return issues;
}

// ── The pipeline ─────────────────────────────────────────────────────────────

/**
 * Validate parsed JSON as a group. Phases run in dependency order and stop at
 * the first that fails — later phases assume earlier ones passed, and running
 * them on a malformed file produces cascading nonsense instead of one clear
 * error. Within a phase, every issue is collected.
 */
export function validate(data: unknown): { group?: Group; issues: Issue[] } {
  const shape = checkShape(data);
  if (shape.length) return { issues: shape };

  const g = data as Group;

  const domain = checkDomainShape(g);
  if (domain.length) return { issues: domain };

  const reach = checkReachability(g);
  if (reach.length) return { issues: reach };

  const laws = checkLaws(g);
  if (laws.length) return { issues: laws };

  return { group: g, issues: [] };
}

/**
 * Freeze a group so the memoisation in group.ts is sound.
 *
 * words() and table() cache against the group object. That is only safe if the
 * arrows cannot change afterwards — so make that true rather than hope for it.
 */
function freezeGroup(g: Group): Group {
  for (const perm of Object.values(g.arrows)) Object.freeze(perm);
  Object.freeze(g.arrows);
  Object.freeze(g.elements);
  Object.freeze(g.generators);
  if (g.aliases) Object.freeze(g.aliases);
  return Object.freeze(g);
}

/** Read one file. Throws GroupValidationError listing everything wrong with it. */
export function loadGroup(path: string): Group {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new GroupValidationError(basename(path), [
      { phase: 1, message: `not valid JSON — ${(e as Error).message}` },
    ]);
  }

  const { group, issues } = validate(parsed);
  if (!group) throw new GroupValidationError(basename(path), issues);
  return freezeGroup(group);
}

/** The library lives next to the source, not next to wherever you happen to be. */
export const LIBRARY_DIR = resolve(import.meta.dirname, "..", "groups");

/**
 * Every group in the library, smallest first.
 *
 * Non-recursive on purpose: `groups/drafts/` holds work in progress that is not
 * expected to be valid, and must stay invisible here.
 *
 * The default directory is resolved from this module's location rather than the
 * process's cwd — otherwise running from any other directory dies with a raw
 * ENOENT, which is a miserable error for someone who is here to learn algebra.
 */
/**
 * Loaded libraries, by directory.
 *
 * Reading and fully validating the library is not expensive in absolute terms
 * (~8ms for three groups) but it was happening on EVERY findGroup() call via a
 * default parameter — measured at 960× the cost of passing the library in.
 * Greedy loading is fine; greedy loading repeatedly is not.
 */
const libraryCache = new Map<string, Group[]>();

/** Forget cached libraries. For tests, or after editing a file on disk. */
export function clearLibraryCache(): void {
  libraryCache.clear();
}

export function loadLibrary(dir: string = LIBRARY_DIR): Group[] {
  const cached = libraryCache.get(dir);
  if (cached) return cached;

  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    throw new Error(`cannot read the group library at ${dir} — expected a directory of *.group.json files`);
  }
  files = files
    .filter((f) => f.endsWith(".group.json"))
    .sort();

  const groups: Group[] = [];
  const failures: GroupValidationError[] = [];

  for (const f of files) {
    try {
      groups.push(loadGroup(join(dir, f)));
    } catch (e) {
      if (e instanceof GroupValidationError) failures.push(e);
      else throw e;
    }
  }
  if (failures.length) throw new LibraryValidationError(failures);

  const sorted = groups.sort((a, b) => a.elements.length - b.elements.length || a.name.localeCompare(b.name));
  libraryCache.set(dir, sorted);
  return sorted;
}

/**
 * Fold an identifier to a comparable form.
 *
 * Nobody is going to type "C₅" dozens of times a day — U+2085 is not on a
 * keyboard. So subscript and superscript digits fold to ASCII, spaces and the
 * usual separators go, and case is ignored. "C₅", "C5", "c 5" and "c-5" all
 * arrive at the same place.
 */
export function normalise(s: string): string {
  const SUB = "₀₁₂₃₄₅₆₇₈₉";
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  return [...s.trim().toLowerCase()]
    .map((ch) => {
      const sub = SUB.indexOf(ch);
      if (sub >= 0) return String(sub);
      const sup = SUP.indexOf(ch);
      if (sup >= 0) return String(sup);
      return ch;
    })
    .join("")
    .replace(/[\s_\-]/g, "");
}

const indexCache = new WeakMap<Group[], Map<string, Group>>();

/**
 * Build the normalised lookup, refusing ambiguity.
 *
 * The invariant is CROSS-GROUP only. Two identifiers may normalise alike as
 * long as they name the same group — that is exactly what an alias is, and the
 * naive version of this rule would reject "C₅" alongside its own alias "C5".
 * What must never happen is one normalised key resolving to two different files.
 */
function index(library: Group[]): Map<string, Group> {
  const hit = indexCache.get(library);
  if (hit) return hit;

  const map = new Map<string, Group>();
  for (const g of library) {
    for (const id of [g.name, ...(g.aliases ?? [])]) {
      const key = normalise(id);
      const existing = map.get(key);
      if (existing && existing !== g) throw new AmbiguousNameError(key, [existing.name, g.name]);
      map.set(key, g);
    }
  }
  indexCache.set(library, map);
  return map;
}

/**
 * Find a group by name or alias, forgiving about how it was typed.
 *
 * Returns undefined rather than throwing — callers that want an error get to
 * choose its wording. commands.ts turns this into UnknownGroupError.
 */
export function findGroup(nameOrAlias: string, library = loadLibrary()): Group | undefined {
  return index(library).get(normalise(nameOrAlias));
}
