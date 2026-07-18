import { mkdir, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const artifacts = resolve(root, "web-ext-artifacts");
const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8")
);
const version = packageJson.version;
const artifactName = `konwerter_walut-${version}-sources.zip`;
const artifactPath = resolve(artifacts, artifactName);

const sourcePaths = [
  ".github",
  "docs",
  "scripts",
  "src",
  "static",
  "tests",
  ".gitignore",
  "CHANGELOG.md",
  "LICENSE",
  "PRIVACY.md",
  "PRIVACY.pl.md",
  "README.md",
  "README.pl.md",
  "RELEASE_CHECKLIST.md",
  "SOURCE_CODE_REVIEW.md",
  "package-lock.json",
  "package.json",
  "test-page.html",
  "tsconfig.json",
  "vitest.config.ts"
];

await mkdir(artifacts, { recursive: true });
await rm(artifactPath, { force: true });

const result = spawnSync(
  "zip",
  ["-r", artifactPath, ...sourcePaths, "-x", "*.DS_Store"],
  { cwd: root, encoding: "utf8" }
);

if (result.status !== 0) {
  throw new Error(result.stderr || result.stdout || "Source packaging failed.");
}

console.log(`Created ${artifactPath}`);
