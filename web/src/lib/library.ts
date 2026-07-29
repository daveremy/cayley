// The group library, without a filesystem.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY NOT loadLibrary()
//
// The first attempt imported loadLibrary() from the engine. It works in Node and
// fails under a bundler, because LIBRARY_DIR resolves against
// import.meta.dirname — which points at the ORIGINAL module in Node and at
// dist/.prerender/ once the module has been bundled and moved.
//
// Resolving relative to the module is the right fix for "run the CLI from
// anywhere". It is the wrong fix for "bundle this", and the two look identical
// until one of them breaks.
//
// So: Vite glob-imports every group file at build time, and each is checked
// through validate() — the pure path, no disk. This has three properties the
// filesystem version does not:
//
//   · it survives bundling, because there is no path to get wrong
//   · it works unchanged in a browser or a Worker
//   · the groups are IN the bundle, so the site is genuinely offline-capable
//     and self-hostable (PRD §11.3d)
// ─────────────────────────────────────────────────────────────────────────────

import type { Group } from "../../../src/group.ts";
import { index, validate } from "../../../src/validate.ts";

const files = import.meta.glob("../../../groups/*.group.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

function build(): Group[] {
  const groups: Group[] = [];

  for (const [path, mod] of Object.entries(files)) {
    const { group, issues } = validate(mod.default);
    if (!group) {
      // A bad group file should fail the BUILD, loudly, with the phase that
      // caught it — not ship a site missing a group nobody notices is absent.
      throw new Error(
        `${path} is not a group:\n${issues.map((i) => `  [phase ${i.phase}] ${i.message}`).join("\n")}`,
      );
    }
    groups.push(group);
  }

  const sorted = groups.sort(
    (a, b) => a.elements.length - b.elements.length || a.name.localeCompare(b.name),
  );

  index(sorted); // rejects a library whose names normalise ambiguously
  return sorted;
}

export const library = build();
