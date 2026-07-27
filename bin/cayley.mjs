#!/usr/bin/env node
// Portable launcher.
//
// A `bin` entry cannot point at src/cli.ts directly: the file has no shebang and
// still needs --experimental-strip-types, so the shell would try to interpret
// TypeScript. A shebang of `#!/usr/bin/env -S node --experimental-strip-types`
// works on modern macOS and Linux but `env -S` is not portable — it fails on
// older coreutils and on Windows.
//
// So: plain .mjs, plain shebang, spawn node with the flag.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const cli = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src", "cli.ts");
const { status } = spawnSync(
  process.execPath,
  ["--experimental-strip-types", cli, ...process.argv.slice(2)],
  { stdio: "inherit" },
);
process.exit(status ?? 1);
