#!/usr/bin/env node
/**
 * Packs the library and imports it from a throwaway project outside the repo.
 *
 * Tests that run inside the repo resolve the `@/*` alias through tsconfig, so
 * they pass even when the published output leaks unresolvable specifiers. Only
 * installing the tarball somewhere else proves the package actually resolves.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repo = resolve(import.meta.dirname, "..");
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", encoding: "utf8" });

const work = mkdtempSync(join(tmpdir(), "babelize-smoke-"));
let failed = false;

try {
  console.log("→ building");
  run("npm", ["run", "build:lib"], repo);

  console.log("→ packing");
  run("npm", ["pack", "--pack-destination", work], repo);
  const tarball = readdirSync(work).find((f) => f.endsWith(".tgz"));
  if (!tarball) throw new Error("npm pack produced no tarball");

  const app = join(work, "app");
  run("mkdir", ["-p", app]);
  writeFileSync(
    join(app, "package.json"),
    JSON.stringify({ name: "smoke", private: true, version: "0.0.0", type: "module" }, null, 2),
  );

  console.log("→ installing tarball into a bare project");
  run(
    "npm",
    ["install", "--no-audit", "--no-fund", join(work, tarball), "react", "react-dom"],
    app,
  );

  writeFileSync(
    join(app, "esm.mjs"),
    `import { LanguageSwitcher, PhoneInput, NavBar, COUNTRIES, cn } from "@babelize/elements";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

for (const [name, value] of Object.entries({ LanguageSwitcher, PhoneInput, NavBar, cn })) {
  if (typeof value !== "function" && typeof value !== "object") {
    throw new Error(\`export \${name} is \${typeof value}\`);
  }
}
if (!Array.isArray(COUNTRIES) || COUNTRIES.length === 0) throw new Error("COUNTRIES empty");

const html = renderToStaticMarkup(
  createElement(LanguageSwitcher, { locales: [{ code: "en" }, { code: "fr" }] }),
);
if (!html.includes("English")) throw new Error("LanguageSwitcher did not render: " + html);

const nav = renderToStaticMarkup(
  createElement(NavBar, { links: [{ label: "Docs", href: "/docs" }] }),
);
if (!nav.includes("/docs")) throw new Error("NavBar did not render links");

console.log("  ESM import + SSR render OK");
`,
  );

  writeFileSync(
    join(app, "cjs.cjs"),
    `const { LanguageSwitcher, COUNTRIES } = require("@babelize/elements");
if (!LanguageSwitcher) throw new Error("CJS export missing");
if (!Array.isArray(COUNTRIES)) throw new Error("CJS COUNTRIES missing");
console.log("  CJS require OK");
`,
  );

  writeFileSync(
    join(app, "utils.mjs"),
    `import { cn } from "@babelize/elements/utils";
if (cn("a", false && "b", "c") !== "a c") throw new Error("cn subpath broken");
console.log("  @babelize/elements/utils OK");
`,
  );

  console.log("→ importing as ESM");
  run("node", ["esm.mjs"], app);
  console.log("→ requiring as CJS");
  run("node", ["cjs.cjs"], app);
  console.log("→ importing the utils subpath");
  run("node", ["utils.mjs"], app);

  // A bundler strips the per-file "use client" directives, and without it every
  // component throws "useState is not a function" inside a React Server
  // Component — the default in the Next.js App Router. Assert on the shipped
  // artifacts so the directive cannot silently disappear again.
  console.log('→ checking the "use client" directive survived bundling');
  for (const file of ["dist/index.js", "dist/index.cjs"]) {
    const head = readFileSync(join(app, "node_modules/@babelize/elements", file), "utf8").slice(
      0,
      200,
    );
    if (!/^\s*["']use client["']/.test(head)) {
      throw new Error(`${file} is missing the "use client" directive`);
    }
  }
  console.log('  "use client" present in ESM and CJS output');

  console.log("\n✓ packaging smoke test passed");
} catch (err) {
  failed = true;
  console.error("\n✗ packaging smoke test failed:", err.message);
} finally {
  rmSync(work, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
