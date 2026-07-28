#!/usr/bin/env bash
# Does commands.ts carry a Node dependency into a browser bundle?
#
# This seam was specified wrongly in four successive drafts. It will drift again
# the moment nobody is watching, so it is checked rather than remembered.
set -euo pipefail
cd "$(dirname "$0")/.."

node --experimental-strip-types -e '
import { loadLibrary } from "./src/load.ts";
import { writeFileSync } from "node:fs";
writeFileSync("test/library.fixture.json", JSON.stringify(loadLibrary(), null, 1));
'

OUT=$(mktemp -t purity).js
if ! npx --yes esbuild test/bundle-purity.fixture.js \
      --bundle --format=esm --platform=browser --outfile="$OUT" --log-level=error 2>&1; then
  echo ""
  echo "✗ commands.ts cannot be bundled for a browser."
  echo "  Something in its import graph reaches node:. See PRD 7.1a —"
  echo "  purity is a property of the import graph, not of a function body."
  exit 1
fi

if grep -qE '"node:' "$OUT"; then
  echo "✗ a node: specifier survived into the bundle:"
  grep -oE '"node:[a-z]+"' "$OUT" | sort -u | sed 's/^/    /'
  exit 1
fi

echo "✓ commands.ts bundles clean — no node built-ins ($(wc -c < "$OUT" | tr -d ' ') bytes)"
