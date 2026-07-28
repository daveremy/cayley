// Three layers, because a CLI has three distinct things that can be wrong.
//
//   1. command layer   pure functions → data. Fast, thorough. Most coverage here.
//   2. adapter         spawn the real process; check stdout and exit codes.
//                      Slow, so kept to the cases that only a process can prove.
//   3. invariants      every command must exist, take --help and --json, and
//                      emit valid JSON. Written as a loop over COMMANDS, so a
//                      new command cannot be added without meeting the contract.
//
// Layer 3 is the one that stops the surface rotting as it grows.

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import * as cmd from "./commands.ts";
import { COMMANDS } from "./commands.ts";
import { DomainError, UnknownElementError, UnknownGroupError } from "./errors.ts";
import { normalise } from "./load.ts";

const CLI = resolve(import.meta.dirname, "cli.ts");

/** Run the real CLI in a real process. */
function cli(...args: string[]): { stdout: string; stderr: string; code: number } {
  const r = spawnSync(process.execPath, ["--experimental-strip-types", CLI, ...args], {
    encoding: "utf8",
  });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", code: r.status ?? -1 };
}

/** Sample arguments good enough to exercise each command. */
const SAMPLE: Record<string, string[]> = {
  list: [],
  show: ["C5"],
  table: ["C5"],
  mul: ["C5", "a2", "a3"],
  word: ["C5", "a3"],
  order: ["C5"],
  diff: ["C4", "V4"],
  check: ["groups/c5.group.json"],
};

// ── Layer 1: the command layer ───────────────────────────────────────────────

describe("commands return data, not output", () => {
  test("list summarises every group", () => {
    const { groups } = cmd.list();
    assert.ok(groups.length >= 3);
    for (const g of groups) {
      assert.equal(typeof g.name, "string");
      assert.equal(typeof g.order, "number");
      assert.equal(typeof g.abelian, "boolean");
    }
  });

  test("mul returns the product AND the path walked", () => {
    assert.deepEqual(cmd.mul("C5", "a2", "a3"), {
      group: "C₅",
      x: "a2",
      y: "a3",
      product: "e",
      path: ["a", "a", "a"],
    });
  });

  test("the path is the mechanic — walking it by hand reproduces the product", () => {
    const { path, product, x } = cmd.mul("V4", "R", "RB");
    assert.deepEqual(path, ["R", "B"]);
    assert.equal(product, "B");
    assert.equal(x, "R");
  });

  test("word gives the identity an empty path", () => {
    const r = cmd.word("C5", "e");
    assert.deepEqual(r.path, []);
    assert.equal(r.isIdentity, true);
  });

  test("show is exhaustive — it is the API response", () => {
    const d = cmd.show("V4");
    for (const key of ["elements", "identity", "elementOrders", "squares", "words", "properties"]) {
      assert.ok(key in d, `show() is missing ${key}`);
    }
    assert.equal(d.properties.latinSquare, true);
    assert.deepEqual(d.squares, { N: "N", R: "N", B: "N", RB: "N" });
  });

  test("order: 1 for the identity, and V₄ is all involutions", () => {
    assert.equal(cmd.orders("V4", "N").orders.N, 1);
    assert.deepEqual(cmd.orders("V4").orders, { N: 1, R: 2, B: 2, RB: 2 });
    assert.equal(cmd.orders("C4", "r").orders.r, 4);
  });

  test("diff names what actually separates two groups of the same order", () => {
    const r = cmd.diff("C4", "V4");
    assert.equal(r.sameOrder, true);
    assert.ok(r.distinguishedBy.includes("all elements self-inverse"));
    assert.ok(r.distinguishedBy.includes("largest element order"));
    assert.ok(!r.distinguishedBy.includes("abelian"), "both are abelian — that is not the difference");
  });

  test("unknown group throws UnknownGroupError, listing what exists", () => {
    assert.throws(() => cmd.show("the monster"), (e: unknown) => {
      assert.ok(e instanceof UnknownGroupError);
      assert.ok(e instanceof DomainError, "must be a DomainError so the adapter maps it to exit 1");
      assert.ok(e.known.length > 0);
      return true;
    });
  });

  test("unknown element throws UnknownElementError, listing the real ones", () => {
    assert.throws(() => cmd.mul("C5", "a2", "zzz"), (e: unknown) => {
      assert.ok(e instanceof UnknownElementError);
      assert.match((e as Error).message, /is not an element of C₅/);
      return true;
    });
  });

  test("commands never print", () => {
    const logged: unknown[] = [];
    const real = console.log;
    console.log = (...a: unknown[]) => void logged.push(a);
    try {
      cmd.list();
      cmd.show("C5");
      cmd.tableOf("C5");
      cmd.diff("C4", "V4");
    } finally {
      console.log = real;
    }
    assert.deepEqual(logged, [], "the command layer wrote to stdout — that belongs in cli.ts");
  });
});

// ── name normalisation ───────────────────────────────────────────────────────

describe("group names are forgiving to type", () => {
  for (const typed of ["C5", "c5", "C₅", "c 5", "C-5", "Z5", "cyclic group of order 5"]) {
    test(`"${typed}" finds C₅`, () => {
      assert.equal(cmd.show(typed).name, "C₅");
    });
  }

  test("subscripts and superscripts both fold to ASCII", () => {
    assert.equal(normalise("C₅"), "c5");
    assert.equal(normalise("x⁴"), "x4");
    assert.equal(normalise("  Klein Four-Group "), "kleinfourgroup");
  });

  test("an alias colliding with its own group's name is fine — that is the point", () => {
    // "C₅" and the alias "C5" both normalise to "c5". Same group, so legal.
    assert.equal(cmd.show("C5").name, cmd.show("C₅").name);
  });
});

// ── Layer 2: the adapter ─────────────────────────────────────────────────────

describe("the CLI process", () => {
  test("happy path exits 0 and prints the path walked", () => {
    const r = cli("mul", "C5", "a2", "a3");
    assert.equal(r.code, 0);
    assert.match(r.stdout, /a2 · a3 = e/);
    assert.match(r.stdout, /follow a then a then a/);
  });

  test("unknown group is a DOMAIN failure — exit 1, not 2", () => {
    const r = cli("show", "C99");
    assert.equal(r.code, 1, "the command was well-formed; the group simply is not there");
    assert.match(r.stderr, /no group called "C99"/);
    assert.match(r.stderr, /the library has:/);
  });

  test("unknown command is a USAGE error — exit 2", () => {
    const r = cli("frobnicate");
    assert.equal(r.code, 2);
    assert.match(r.stderr, /unknown command "frobnicate"/);
  });

  test("a missing argument is a usage error — exit 2", () => {
    const r = cli("mul", "C5");
    assert.equal(r.code, 2);
    assert.match(r.stderr, /needs/);
  });

  test("an unknown flag is a usage error — exit 2", () => {
    const r = cli("list", "--bogus");
    assert.equal(r.code, 2);
  });

  // ⚑ Half of Q₈'s elements start with a dash: -1, -i, -j, -k. An arg parser
  // that claims dash-led tokens as flags makes those elements unreachable.
  // C₂ = {1, -1} is the fixture that keeps this honest.
  test("dash-led element names are positionals, not flags", () => {
    const r = cli("word", "C2", "-1");
    assert.equal(r.code, 0, `"-1" was swallowed as a flag: ${r.stderr}`);
    assert.match(r.stdout, /-1 = -1/);
  });

  test("multiplying two dash-led elements works", () => {
    const r = cli("mul", "C2", "-1", "-1", "--json");
    assert.equal(r.code, 0);
    assert.equal(JSON.parse(r.stdout).product, "1");
  });

  test("-- means everything after it is positional, as POSIX says", () => {
    // Pathological but legal: an element literally named "--json". Without
    // honouring "--" there would be no way to name it at all.
    const r = cli("word", "C5", "--", "--json");
    assert.equal(r.code, 1, "should reach the domain layer and report an unknown element");
    assert.match(r.stderr, /"--json" is not an element/);
  });

  test("flags before -- still work", () => {
    const r = cli("mul", "C5", "--json", "--", "a2", "a3");
    assert.equal(r.code, 0);
    assert.equal(JSON.parse(r.stdout).product, "e");
  });

  test("an empty element argument is reported, not silently ignored", () => {
    const r = cli("order", "C5", "");
    assert.equal(r.code, 1);
    assert.match(r.stderr, /is not an element of C₅/);
  });

  test("a dash-led name that is NOT an element is a domain error, not a usage error", () => {
    const r = cli("word", "C5", "-1");
    assert.equal(r.code, 1, "should reach the domain layer, not be rejected by the parser");
    assert.match(r.stderr, /is not an element of C₅/);
  });

  test("an invalid group file exits 1 with the phase that failed", () => {
    const r = cli("check", "groups/drafts/broken.group.json");
    assert.equal(r.code, 1);
    assert.match(r.stderr, /phase 3/);
    assert.match(r.stderr, /every node needs one arrow of each colour/);
  });

  test("--help exits 0 and lists every command", () => {
    const r = cli("--help");
    assert.equal(r.code, 0);
    for (const c of COMMANDS) assert.match(r.stdout, new RegExp(`cayley ${c}`));
  });

  test("no arguments prints help rather than failing", () => {
    const r = cli();
    assert.equal(r.code, 0);
    assert.match(r.stdout, /group theory from the command line/);
  });

  test("the bin shim works — this is what npm link installs", () => {
    const shim = resolve(import.meta.dirname, "..", "bin", "cayley.mjs");
    const r = spawnSync(process.execPath, [shim, "mul", "C5", "a2", "a3"], { encoding: "utf8" });
    assert.equal(r.status, 0);
    assert.match(r.stdout ?? "", /a2 · a3 = e/);
  });
});

// ── Layer 3: invariants over the whole command surface ───────────────────────

describe("every command honours the contract", () => {
  for (const c of COMMANDS) {
    const args = SAMPLE[c];

    test(`${c}: exists and succeeds`, () => {
      assert.ok(args, `no sample arguments defined for "${c}" — add them`);
      assert.equal(cli(c, ...args).code, 0);
    });

    test(`${c}: --json emits valid, non-empty JSON`, () => {
      const r = cli(c, ...args, "--json");
      assert.equal(r.code, 0);
      const parsed = JSON.parse(r.stdout);
      assert.equal(typeof parsed, "object");
      assert.ok(Object.keys(parsed).length > 0);
    });

    test(`${c}: --json prints nothing but JSON`, () => {
      // Anything else on stdout would break piping to jq.
      const r = cli(c, ...args, "--json");
      assert.doesNotThrow(() => JSON.parse(r.stdout));
    });

    test(`${c}: appears in --help`, () => {
      assert.match(cli("--help").stdout, new RegExp(`cayley ${c}`));
    });
  }
});
