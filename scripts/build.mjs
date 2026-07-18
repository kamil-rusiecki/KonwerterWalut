import { context } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const watch = process.argv.includes("--watch");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, "static"), dist, { recursive: true });

const buildContext = await context({
  absWorkingDir: root,
  entryPoints: {
    background: "src/background/index.ts",
    content: "src/content/index.ts"
  },
  outdir: dist,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "firefox109",
  sourcemap: true,
  minify: false,
  logLevel: "info"
});

if (watch) {
  await buildContext.watch();
  console.log("Watching extension sources…");
} else {
  await buildContext.rebuild();
  await buildContext.dispose();
}
