// Reading groups off the disk. Node only, and that is fine — the CLI is a Node
// program.
//
// Everything mathematical lives in validate.ts, which imports nothing but
// group.ts and errors.ts and therefore runs in a browser. This file is the part
// that cannot: readFileSync, readdirSync, a directory path.
//
// Nothing from validate.ts is re-exported here, on purpose. Re-exporting would
// let someone import findGroup from load.ts — which compiles, works in Node, and
// quietly pulls node:fs into a web bundle. The split only holds if crossing it
// is inconvenient.

import { readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import type { Group } from "./group.ts";
import { GroupValidationError, LibraryValidationError } from "./errors.ts";
import { freezeGroup, index, validate } from "./validate.ts";

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
 * Loaded libraries, by directory.
 *
 * Reading and fully validating the library is not expensive in absolute terms
 * (~8 ms for six groups) but it was happening on EVERY findGroup() call via a
 * default parameter — measured at 960x the cost of passing the library in.
 * Greedy loading is fine; greedy loading repeatedly is not.
 */
const libraryCache = new Map<string, Group[]>();

/** Forget cached libraries. For tests, or after editing a file on disk. */
export function clearLibraryCache(): void {
  libraryCache.clear();
}

/**
 * Every group in the library, smallest first.
 *
 * Non-recursive on purpose: groups/drafts/ holds work in progress that is not
 * expected to be valid, and must stay invisible here.
 *
 * The default directory is resolved from this module's location rather than the
 * process's cwd — otherwise running from any other directory dies with a raw
 * ENOENT, which is a miserable error for someone who is here to learn algebra.
 */
export function loadLibrary(dir: string = LIBRARY_DIR): Group[] {
  const cached = libraryCache.get(dir);
  if (cached) return cached;

  let files: string[];
  try {
    files = readdirSync(dir);
  } catch {
    throw new Error(`cannot read the group library at ${dir} — expected a directory of *.group.json files`);
  }
  files = files.filter((f) => f.endsWith(".group.json")).sort();

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

  // Build the normalised index NOW, before caching, so an ambiguous library is
  // rejected at load rather than on the first lookup. Otherwise `cayley list`
  // would happily accept a library that `cayley show` cannot use — the sort of
  // split-brain state this project exists to avoid.
  index(sorted);

  libraryCache.set(dir, sorted);
  return sorted;
}
