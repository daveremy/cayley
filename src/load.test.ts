// Tests for the loader — that it accepts real groups and rejects everything else
// with an error that names the mathematics.
//
// The negative cases matter more than the positive ones here. A validator that
// only ever sees valid input is untested.

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";

import { clearLibraryCache, findGroup, loadGroup, loadLibrary, validate } from "./load.ts";
import type { Group } from "./group.ts";

/** A valid C₄, to be broken in various ways below. */
const good = (): Record<string, unknown> => ({
  name: "C₄",
  elements: ["e", "r", "r2", "r3"],
  identity: "e",
  generators: ["r"],
  arrows: { r: { e: "r", r: "r2", r2: "r3", r3: "e" } },
});

/** Validate an object and return its issue messages, joined. */
const problems = (data: unknown): string => validate(data).issues.map((i) => i.message).join(" | ");

describe("the library loads and self-audits", () => {
  const lib = loadLibrary();

  test("every file in groups/ is a real group", () => {
    assert.ok(lib.length >= 3, "expected at least three groups");
  });

  test("one Group per .group.json file", () => {
    const files = readdirSync("groups").filter((f) => f.endsWith(".group.json"));
    assert.equal(lib.length, files.length);
  });

  test("drafts/ is not loaded — it holds work in progress, valid or not", () => {
    assert.ok(!lib.some((g) => g.name === "Q₈"), "the Q₈ draft leaked into the library");
  });

  test("sorted smallest first", () => {
    const orders = lib.map((g) => g.elements.length);
    assert.deepEqual(orders, [...orders].sort((a, b) => a - b));
  });

  test("metadata survives the trip from JSON", () => {
    const v4 = findGroup("V₄", lib) as Group;
    assert.ok(v4.aliases?.includes("Klein four-group"));
    assert.ok(v4.notes?.includes("rectangle"));
  });
});

describe("findGroup is alias-aware — six names, one object", () => {
  const lib = loadLibrary();

  for (const alias of ["V₄", "Klein four-group", "C₂ × C₂", "ℤ/2 × ℤ/2", "D₂", "the rectangle group"]) {
    test(`"${alias}" resolves to V₄`, () => {
      assert.equal(findGroup(alias, lib)?.name, "V₄");
    });
  }

  test("case-insensitive", () => {
    assert.equal(findGroup("klein FOUR-group", lib)?.name, "V₄");
  });

  test("unknown name returns undefined rather than throwing", () => {
    assert.equal(findGroup("the monster", lib), undefined);
  });
});

describe("phase 2 — shape", () => {
  test("rejects a non-object", () => {
    assert.match(problems([1, 2, 3]), /not a JSON object/);
  });

  test("rejects a missing identity", () => {
    const d = good();
    delete d.identity;
    assert.match(problems(d), /identity must be a non-empty string/);
  });

  test("rejects elements that are not strings", () => {
    const d = good();
    d.elements = [1, 2, 3];
    assert.match(problems(d), /elements must be an array of strings/);
  });
});

describe("phase 3 — domain shape", () => {
  test("identity must be one of the elements", () => {
    const d = good();
    d.identity = "nope";
    assert.match(problems(d), /is not one of the elements/);
  });

  test("a generator must be an element", () => {
    const d = good();
    d.generators = ["q"];
    assert.match(problems(d), /is not an element/);
  });

  test("every node needs an arrow of every colour leaving it", () => {
    const d = good();
    d.arrows = { r: { e: "r", r: "r2" } };
    assert.match(problems(d), /has no arrow out of "r2", "r3"/);
  });

  test("arrows may not point at non-elements", () => {
    const d = good();
    d.arrows = { r: { e: "r", r: "r2", r2: "r3", r3: "elsewhere" } };
    assert.match(problems(d), /points at "elsewhere", which is not an element/);
  });

  test("an arrow map must be a permutation", () => {
    const d = good();
    d.arrows = { r: { e: "r", r: "r2", r2: "r2", r3: "e" } };
    assert.match(problems(d), /is not a permutation/);
  });

  test("⚑ the labelling law: arrows[g] must leave the identity on g", () => {
    // A genuine C₄ in every respect — bijective, generates everything, satisfies
    // every group law — but the arrow labelled r actually performs r³. Nothing
    // except this check notices, and every table cell would be wrong relative to
    // the names on the page.
    const d = good();
    d.arrows = { r: { e: "r3", r3: "r2", r2: "r", r: "e" } };

    const msg = problems(d);
    assert.match(msg, /leaves the identity "e" and lands on "r3", not "r"/);

    // and prove the point: strip the labelling check and it would sail through
    const asGroup = d as unknown as Group;
    const reachable = new Set<string>();
    let cur = asGroup.identity;
    for (let i = 0; i < 4; i++) {
      reachable.add(cur);
      cur = asGroup.arrows.r[cur];
    }
    assert.equal(reachable.size, 4, "the mislabelled map really does generate the whole group");
  });
});

describe("phase 4 — generators must actually generate", () => {
  test("names the elements it cannot reach", () => {
    // C₄'s elements, but the only generator is r², which reaches just {e, r2}
    const d = good();
    d.generators = ["r2"];
    d.arrows = { r2: { e: "r2", r2: "e", r: "r3", r3: "r" } };
    assert.match(problems(d), /do not reach "r", "r3" — they do not generate the group/);
  });
});

describe("phase 5 — the group laws", () => {
  // Reaching phase 5 with bad data is harder than it sounds: phase 3 already
  // demands every generator be a permutation and obey the labelling law, and
  // phase 4 demands they generate. The case below clears all of that and still
  // fails, because the permutations generate a group LARGER than the node set —
  // so the action is not simply transitive and the derived operation cannot be
  // associative. Two different words for the same element disagree.
  const notAGroup = {
    name: "permutations that generate too much",
    elements: ["e", "a", "b", "c"],
    identity: "e",
    generators: ["a", "b"],
    arrows: {
      a: { e: "a", a: "b", b: "c", c: "e" }, // 4-cycle
      b: { e: "b", b: "a", a: "c", c: "e" }, // a different 4-cycle
    },
  };

  test("clears phases 2–4 — the arrows really are permutations that generate", () => {
    for (const gen of ["a", "b"] as const) {
      const targets = Object.values(notAGroup.arrows[gen]);
      assert.equal(new Set(targets).size, 4, `arrows.${gen} is not a permutation`);
      assert.equal(notAGroup.arrows[gen].e, gen, "labelling law should hold");
    }
  });

  test("catches a non-associative operation", () => {
    assert.match(problems(notAGroup), /not associative — \(a·a\)·c = "e" but a·\(a·c\) = "b"/);
  });

  test("catches a missing inverse", () => {
    assert.match(problems(notAGroup), /"a" has no inverse — nothing undoes it/);
  });

  test("control: a genuine C₃ passes every phase", () => {
    const c3 = {
      name: "C₃",
      elements: ["e", "x", "y"],
      identity: "e",
      generators: ["x"],
      arrows: { x: { e: "x", x: "y", y: "e" } },
    };
    assert.equal(problems(c3), "");
  });
});

describe("phase 2 — optional metadata is validated too", () => {
  test("aliases must be an array of strings, not a bare string", () => {
    const d = good();
    d.aliases = "Z4";
    assert.match(problems(d), /aliases must be an array of strings/);
  });

  test("aliases must not contain non-strings", () => {
    const d = good();
    d.aliases = [1];
    assert.match(problems(d), /aliases must be an array of strings/);
  });

  test("a malformed alias is rejected at load, not left to crash findGroup later", () => {
    const d = good();
    d.aliases = [1];
    const { group } = validate(d);
    assert.equal(group, undefined, "a file with malformed aliases must not be handed back as a Group");
  });

  test("notes and source must be strings", () => {
    const d = good();
    d.notes = 42;
    assert.match(problems(d), /notes must be a string if present/);
  });

  test("duplicate generators are rejected — the schema says uniqueItems, so the loader must too", () => {
    const d = good();
    d.generators = ["r", "r"];
    assert.match(problems(d), /generators lists "r" more than once/);
  });

  test("a typo'd field name is reported rather than silently ignored", () => {
    const d = good();
    d.alises = ["oops"];
    assert.match(problems(d), /unknown field\(s\): "alises"/);
  });
});

describe("loadGroup errors name the file", () => {
  test("throws on a file that is not JSON", () => {
    assert.throws(() => loadGroup("package.json"), /package\.json/);
  });

  test("throws on a missing file", () => {
    assert.throws(() => loadGroup("groups/nope.group.json"));
  });

  test("the library resolves relative to the source, not the cwd", () => {
    // Running from any other directory must not produce a raw ENOENT.
    const before = process.cwd();
    try {
      process.chdir("/tmp");
      assert.ok(loadLibrary().length >= 3);
    } finally {
      process.chdir(before);
    }
  });

  test("a missing library directory explains itself", () => {
    assert.throws(() => loadLibrary("/tmp/definitely-not-a-group-library"), /cannot read the group library/);
  });
});

describe("loading is cached, and loaded groups are frozen", () => {
  test("loadLibrary returns the same instance rather than re-reading", () => {
    const a = loadLibrary();
    const b = loadLibrary();
    assert.equal(a, b, "second call should hit the cache, not the disk");
  });

  test("clearLibraryCache forces a genuine reload", () => {
    const a = loadLibrary();
    clearLibraryCache();
    const b = loadLibrary();
    assert.notEqual(a, b, "after clearing, the library should be read again");
    assert.deepEqual(
      a.map((g) => g.name),
      b.map((g) => g.name),
      "…and produce the same groups",
    );
  });

  test("a loaded group cannot be mutated — the memo caches depend on it", () => {
    const v4 = findGroup("V₄") as Group;
    assert.ok(Object.isFrozen(v4));
    assert.ok(Object.isFrozen(v4.arrows));
    assert.ok(Object.isFrozen(v4.arrows.R));
    assert.ok(Object.isFrozen(v4.elements));
    assert.throws(() => {
      (v4.arrows.R as Record<string, string>).N = "hacked";
    }, TypeError);
    assert.equal(v4.arrows.R.N, "R");
  });

  test("repeated findGroup with the default library is cheap after the first", () => {
    findGroup("V₄"); // warm
    const t0 = performance.now();
    for (let i = 0; i < 200; i++) findGroup("V₄");
    const perCall = (performance.now() - t0) / 200;
    assert.ok(perCall < 0.05, `expected sub-0.05ms per call, got ${perCall.toFixed(3)}ms`);
  });
});

describe("ambiguity is rejected at load, not at lookup", () => {
  test("a library whose files normalise to the same name refuses to load", async () => {
    const { mkdtempSync, writeFileSync, cpSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");

    const dir = mkdtempSync(join(tmpdir(), "cayley-ambiguous-"));
    cpSync("groups/c5.group.json", join(dir, "c5.group.json"));

    // A different group whose name normalises to "c5" — a genuine ambiguity.
    writeFileSync(
      join(dir, "impostor.group.json"),
      JSON.stringify({
        name: "C₅ ",
        elements: ["e", "x"],
        identity: "e",
        generators: ["x"],
        arrows: { x: { e: "x", x: "e" } },
      }),
    );

    assert.throws(() => loadLibrary(dir), /ambiguous/i);
  });
});
