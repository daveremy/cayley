// @ts-check
import { defineConfig } from "astro/config";

// Static by default. The site is content plus islands; nothing needs rendering
// per request. Only the future API needs Workers, and that is a separate
// deployment (PRD §7.4, §11.3d).
//
// Building to plain static HTML also keeps the site self-hostable, which matters
// because the content is CC BY 4.0 — content nobody else can rehost is not
// meaningfully open.
export default defineConfig({
  output: "static",
  srcDir: "./src",
  outDir: "./dist",
});
