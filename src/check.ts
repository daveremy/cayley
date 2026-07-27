// Validate ONE group file and say exactly what is still wrong with it.
//
//   npm run check groups/drafts/q8.group.json
//
// The authoring loop: edit, run this, read the problems in the vocabulary of the
// subject, fix, repeat. When it passes, move the file into groups/.

import { basename } from "node:path";
import { GroupValidationError, loadGroup } from "./load.ts";
import { isAbelian, table, words } from "./group.ts";

const path = process.argv[2];

if (!path) {
  console.error("usage: npm run check <file.group.json>");
  process.exit(2);
}

try {
  const g = loadGroup(path);
  const order = g.elements.length;

  console.log(`\n✓ ${basename(path)} is a group.\n`);
  console.log(`  name        ${g.name}`);
  if (g.aliases?.length) console.log(`  also called ${g.aliases.join(", ")}`);
  console.log(`  order       ${order}`);
  console.log(`  generators  ${g.generators.join(", ")}`);
  console.log(`  abelian     ${isAbelian(g)}`);

  const t = table(g);
  const selfInverse = g.elements.filter((x) => t[x][x] === g.identity).length;
  console.log(`  self-inverse elements  ${selfInverse}/${order}`);
  console.log(`  words       ${[...words(g)].map(([e, w]) => `${e}=${w.join("·") || "(e)"}`).join("  ")}\n`);
} catch (e) {
  if (e instanceof GroupValidationError) {
    console.error(`\n✗ ${e.file} — not a group yet. ${e.issues.length} problem(s):\n`);
    for (const i of e.issues) console.error(`  [phase ${i.phase}] ${i.message}`);
    console.error("");
    process.exit(1);
  }
  throw e;
}
