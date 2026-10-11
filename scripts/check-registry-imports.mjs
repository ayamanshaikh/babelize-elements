import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const source = readFileSync(new URL("../src/registry/registry.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { getRegistryIndex, getRegistryItem } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

for (const definition of getRegistryIndex().items) {
  const item = getRegistryItem(definition.name);
  const files = [...item.files];
  const visited = new Set();
  const collect = (entry) => {
    for (const url of entry.registryDependencies ?? []) {
      const name = new URL(url).pathname
        .split("/")
        .pop()
        .replace(/\.json$/, "");
      if (visited.has(name)) continue;
      visited.add(name);
      const dependency = getRegistryItem(name);
      assert.ok(dependency, `Missing registry dependency: ${name}`);
      files.push(...dependency.files);
      collect(dependency);
    }
  };
  collect(item);
  for (const file of files) {
    for (const match of file.content.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), match[1]));
      assert.ok(
        files.some((candidate) =>
          ["", ".ts", ".tsx", "/index.ts", "/index.tsx"].some(
            (ext) => candidate.path === target + ext,
          ),
        ),
        `${definition.name}: ${file.path} imports missing ${match[1]}`,
      );
    }
  }
}
console.log("All registry relative imports resolve through shipped dependencies.");
