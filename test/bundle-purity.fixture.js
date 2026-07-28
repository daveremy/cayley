// Proves commands.ts carries no Node dependency into a bundle.
//
// The naive version of this test is worthless: importing a module without USING
// it lets rollup shake the whole graph away, so the bundle comes out empty and
// the assertion passes while the seam is still broken. Every value below must
// escape, or we are testing nothing.

import * as cmd from "../src/commands.ts";
import lib from "./library.fixture.json" with { type: "json" };

globalThis.__probe = [
  cmd.list(lib).groups.length,
  cmd.show(lib, "C5").order,
  cmd.tableOf(lib, "V4").elements.length,
  cmd.mul(lib, "Q8", "i", "j").product,
  cmd.word(lib, "C5", "a3").path,
  cmd.orders(lib, "C4").orders,
  cmd.diff(lib, "Q8", "D4").distinguishedBy,
  cmd.arrowsOf(lib, "V4").convention,
  cmd.describe(lib[0]).properties.latinSquare,
  Object.keys(cmd),
];
