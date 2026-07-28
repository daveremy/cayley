// The CLI adapter. Formatting and exit codes. No mathematics lives here.
//
// Everything below either calls a function in commands.ts and prints the result,
// or maps an error to an exit code. If you find yourself computing something in
// this file, it belongs in commands.ts.
//
//   0  success
//   1  domain failure   — well-formed command, operation did not succeed
//   2  usage error      — the invocation itself was wrong
//
// This file is where the filesystem lives. It reads the library and hands it to
// commands.ts, which never touches a disk. `check` is here for the same reason:
// it takes a PATH, and a function taking a path cannot live in a module a
// browser imports.

import * as cmd from "./commands.ts";
import { COMMANDS } from "./commands.ts";
import { loadGroup, loadLibrary } from "./load.ts";
import { DomainError, GroupValidationError, LibraryValidationError, UnknownGroupError, UsageError } from "./errors.ts";

const HELP = `
  cayley — group theory from the command line

  cayley list                      every group in the library
  cayley show <group>              one group, in full
  cayley table <group>             the multiplication table
  cayley arrows <group>            the Cayley diagram, as data
  cayley mul <group> <x> <y>       one product, and the path walked
  cayley word <group> <element>    an element's path from the identity
  cayley order <group> [element]   element orders
  cayley diff <a> <b>              two groups side by side
  cayley check <file>              is this file a group?

  --json    machine-readable output, for scripting or piping to jq
  --help    this

  Group names are forgiving: C5, c5, C₅ and "the rectangle group" all work.
`;

// ── formatters ───────────────────────────────────────────────────────────────

const pad = (s: string, n: number) => s.padEnd(n);
const yn = (b: boolean) => (b ? "yes" : "no");

function printList(r: ReturnType<typeof cmd.list>): void {
  console.log("");
  const w = Math.max(...r.groups.map((g) => g.name.length)) + 2;
  for (const g of r.groups) {
    console.log(
      `  ${pad(g.name, w)}order ${pad(String(g.order), 4)}` +
        `${pad(g.abelian ? "abelian" : "non-abelian", 14)}${g.aliases.slice(0, 3).join(", ")}`,
    );
  }
  console.log("");
}

function printDetail(d: cmd.Detail): void {
  console.log(`\n${d.name}`);
  if (d.aliases.length) console.log(`  also called    ${d.aliases.join(", ")}`);
  console.log(`  order          ${d.order}`);
  console.log(`  elements       ${d.elements.join(", ")}`);
  console.log(`  identity       ${d.identity}`);
  console.log(`  generators     ${d.generators.join(", ")}   (${d.generators.length} needed)`);
  console.log(`  abelian        ${yn(d.abelian)}`);
  console.log(`  element orders ${Object.entries(d.elementOrders).map(([k, v]) => `${k}:${v}`).join("  ")}`);
  console.log(`  squares        ${Object.entries(d.squares).map(([k, v]) => `${k}²=${v}`).join("  ")}`);
  console.log(`  words          ${Object.entries(d.words).map(([k, v]) => `${k}=${v.join("·") || "(e)"}`).join("  ")}`);
  const p = d.properties;
  console.log(
    `\n  closed ${yn(p.closed)} · identity ${yn(p.identityWorks)} · inverses ${yn(p.everyElementHasInverse)}` +
      ` · associative ${yn(p.associative)} · latin square ${yn(p.latinSquare)}`,
  );
  if (d.notes) console.log(`\n  ${d.notes}`);
  console.log("");
}

function printTable(r: ReturnType<typeof cmd.tableOf>): void {
  const w = Math.max(...r.elements.map((e) => e.length)) + 2;
  console.log(`\n${r.name}`);
  console.log(pad("·", w) + r.elements.map((e) => pad(e, w)).join(""));
  for (const row of r.elements) {
    console.log(pad(row, w) + r.elements.map((col) => pad(r.rows[row][col], w)).join(""));
  }
  console.log("");
}

function printDiff(r: ReturnType<typeof cmd.diff>): void {
  const L = 26;
  console.log(`\n  ${pad("", L)}${pad(r.a.name, 16)}${r.b.name}`);
  const row = (label: string, l: unknown, r2: unknown) =>
    console.log(`  ${pad(label, L)}${pad(String(l), 16)}${String(r2)}`);
  row("order", r.a.order, r.b.order);
  row("generators needed", r.a.generators.length, r.b.generators.length);
  row("abelian", yn(r.a.abelian), yn(r.b.abelian));
  row("all self-inverse", yn(r.a.allSelfInverse), yn(r.b.allSelfInverse));
  row("largest element order", r.a.largestElementOrder, r.b.largestElementOrder);

  const prof = (p: Record<number, number>) =>
    Object.entries(p).map(([o, n]) => `${n}×order-${o}`).join("  ");
  console.log(`\n  how many elements of each order:`);
  console.log(`    ${pad(r.a.name, 6)}${prof(r.a.orderProfile)}`);
  console.log(`    ${pad(r.b.name, 6)}${prof(r.b.orderProfile)}`);

  console.log(`\n  diagonals (every element squared):`);
  for (const g of [r.a, r.b]) {
    console.log(`    ${pad(g.name, 6)}${Object.entries(g.squares).map(([k, v]) => `${k}²=${v}`).join("  ")}`);
  }
  console.log(
    r.distinguishedBy.length
      ? `\n  ${r.sameOrder ? "Same order, different groups." : "Different groups."} ` +
          `Told apart by: ${r.distinguishedBy.join(", ")}.\n`
      : `\n  Nothing here tells them apart. These invariants can only REFUTE\n` +
        `  isomorphism, never confirm it — so this is "no evidence against",\n` +
        `  not proof that they are the same group.\n`,
  );
}

// ── the adapter ──────────────────────────────────────────────────────────────

function run(command: string, args: string[], json: boolean): void {
  // read once, per invocation. commands never load anything themselves.
  const lib = loadLibrary();

  const arg = (i: number, what: string): string => {
    const v = args[i];
    if (v === undefined) throw new UsageError(`${command} needs ${what}`);
    return v;
  };
  const out = (data: unknown, print: () => void) => (json ? console.log(JSON.stringify(data, null, 2)) : print());

  switch (command) {
    case "list": {
      const r = cmd.list(lib);
      return out(r, () => printList(r));
    }
    case "show": {
      const r = cmd.show(lib, arg(0, "a group name"));
      return out(r, () => printDetail(r));
    }
    case "table": {
      const r = cmd.tableOf(lib, arg(0, "a group name"));
      return out(r, () => printTable(r));
    }
    case "arrows": {
      const r = cmd.arrowsOf(lib, arg(0, "a group name"));
      return out(r, () => {
        console.log(`\n${r.group}   ${r.convention}\n`);
        const froms = Object.keys(r.arrows[r.generators[0]]);
        const w = Math.max(6, ...froms.map((f) => f.length + 2));
        console.log("  " + pad("from", w) + r.generators.map((gen) => pad(`follow ${gen}`, w + 8)).join(""));
        for (const from of froms) {
          console.log("  " + pad(from, w) + r.generators.map((gen) => pad(`→ ${r.arrows[gen][from]}`, w + 8)).join(""));
        }
        console.log("");
      });
    }
    case "mul": {
      const r = cmd.mul(lib, arg(0, "a group name"), arg(1, "two elements"), arg(2, "a second element"));
      return out(r, () => {
        console.log(`\n  ${r.x} · ${r.y} = ${r.product}`);
        console.log(`  (start at ${r.x}, follow ${r.path.length ? r.path.join(" then ") : "no arrows"})\n`);
      });
    }
    case "word": {
      const r = cmd.word(lib, arg(0, "a group name"), arg(1, "an element"));
      return out(r, () =>
        console.log(
          `\n  ${r.element} = ${r.isIdentity ? "(the empty path — it IS the identity)" : r.path.join(" · ")}\n`,
        ),
      );
    }
    case "order": {
      const r = cmd.orders(lib, arg(0, "a group name"), args[1]);
      return out(r, () => {
        console.log("");
        for (const [x, n] of Object.entries(r.orders)) {
          console.log(`  ${pad(x, 6)}order ${n}${n === 1 ? "   (the identity)" : ""}`);
        }
        console.log("");
      });
    }
    case "diff": {
      const r = cmd.diff(lib, arg(0, "two group names"), arg(1, "a second group name"));
      return out(r, () => printDiff(r));
    }
    case "check": {
      // the only command that reads a path. That is why it is here and not in
      // commands.ts — see the header.
      const file = arg(0, "a file path");
      const r = { ...cmd.describe(loadGroup(file)), file, valid: true as const };
      return out(r, () => {
        console.log(`\n✓ ${r.file} is a group.`);
        printDetail(r);
      });
    }
    default:
      throw new UsageError(`unknown command "${command}"`);
  }
}

// ── entry ────────────────────────────────────────────────────────────────────

/**
 * Split flags from positionals.
 *
 * node:util.parseArgs cannot be used here, and the reason is mathematical rather
 * than stylistic: HALF OF Q₈'S ELEMENTS START WITH A DASH — -1, -i, -j, -k. In
 * strict mode parseArgs claims any dash-led token as an option, so
 * `cayley word Q8 -1` fails as "unknown option '-1'" and the user is told to
 * write `-- "-1"`, which nobody should have to know.
 *
 * The flag set here is small and closed, so an exact-match partition is both
 * simpler and correct. Anything that is not one of these known flags is a
 * positional, dash or no dash.
 *
 * `--` still means what POSIX says it means: everything after it is a positional,
 * no exceptions. Needed for the pathological but legal case of an element or a
 * file path literally named "--json".
 */
function partition(argv: string[]): { json: boolean; help: boolean; positionals: string[] } {
  const FLAGS = new Set(["--json", "--help", "-h"]);
  const positionals: string[] = [];
  let json = false;
  let help = false;
  let literal = false; // set once "--" is seen; everything after is positional

  for (const a of argv) {
    if (literal) positionals.push(a);
    else if (a === "--") literal = true;
    else if (a === "--json") json = true;
    else if (a === "--help" || a === "-h") help = true;
    else if (a.startsWith("--") && !FLAGS.has(a)) throw new UsageError(`unknown option "${a}"`);
    else positionals.push(a);
  }
  return { json, help, positionals };
}

try {
  const { json, help, positionals } = partition(process.argv.slice(2));
  const [command, ...rest] = positionals;

  if (help || !command) {
    console.log(HELP);
    process.exit(0);
  }
  run(command, rest, json);
} catch (e) {
  if (e instanceof UnknownGroupError) {
    console.error(`\n${e.message}\n\nthe library has:`);
    for (const name of e.known) console.error(`  ${name}`);
    console.error("");
    process.exit(1);
  }
  // Validation errors carry structured issues, so render the phase that failed.
  // The phase is not noise: it says which layer rejected the file, and therefore
  // what kind of problem it is — shape, domain shape, reachability, or the laws.
  if (e instanceof GroupValidationError) {
    console.error(`\n✗ ${e.file} — not a group yet. ${e.issues.length} problem(s):\n`);
    for (const i of e.issues) console.error(`  [phase ${i.phase}] ${i.message}`);
    console.error("");
    process.exit(1);
  }
  if (e instanceof LibraryValidationError) {
    console.error(`\n✗ the group library has ${e.failures.length} bad file(s):\n`);
    for (const f of e.failures) {
      console.error(`  ${f.file}`);
      for (const i of f.issues) console.error(`    [phase ${i.phase}] ${i.message}`);
    }
    console.error("");
    process.exit(1);
  }
  if (e instanceof DomainError) {
    console.error(`\n${e.message}\n`);
    process.exit(1);
  }
  if (e instanceof UsageError) {
    console.error(`\n${e.message}`);
    console.error(`\ntry one of: ${COMMANDS.join(", ")}   (cayley --help)\n`);
    process.exit(2);
  }
  throw e;
}
