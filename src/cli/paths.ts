/**
 * Alias resolution for the `babelize add` CLI.
 *
 * components.json stores aliases as import specifiers (`@/components`), not
 * directories. Turning one into a path means consulting the consumer's tsconfig:
 * in most Next.js projects `@/*` maps to `./src/*`, so stripping the `@/` prefix
 * would write files a level too high and leave their imports unresolvable.
 */

export interface TsPathsConfig {
  baseUrl: string;
  paths: Record<string, string[]>;
}

/** Tolerates comments and trailing commas, which tsconfig.json is allowed to have. */
export function parseJsonc<T = unknown>(raw: string): T | null {
  try {
    const withoutComments = raw.replace(
      /"(?:\\.|[^"\\])*"|\/\/[^\n\r]*|\/\*[\s\S]*?\*\//g,
      (match) => (match.startsWith('"') ? match : ""),
    );
    return JSON.parse(withoutComments.replace(/,(\s*[}\]])/g, "$1")) as T;
  } catch {
    return null;
  }
}

function normalize(dir: string): string {
  return dir.replace(/^\.\//, "").replace(/\/+$/, "");
}

/**
 * Resolves an alias such as `@/components/ui` to a directory relative to the
 * project root. Falls back to stripping a leading `@/` when there is no usable
 * tsconfig, which matches the pre-tsconfig behaviour.
 */
export function resolveAliasToDir(alias: string, config: TsPathsConfig | null): string {
  const fallback = normalize(alias.replace(/^@\//, ""));
  if (!config) return fallback;

  const base = normalize(config.baseUrl || ".");
  const joinParts = (...parts: string[]) => parts.filter(Boolean).join("/");
  const prefixed = (rest: string) => normalize(joinParts(base, rest));

  // Longest pattern first, so `@/lib/*` beats `@/*` when both are declared.
  const entries = Object.entries(config.paths).sort((a, b) => b[0].length - a[0].length);

  for (const [pattern, targets] of entries) {
    const target = targets[0];
    if (!target) continue;

    if (pattern.endsWith("/*") && target.endsWith("/*")) {
      const aliasPrefix = pattern.slice(0, -1);
      if (alias === aliasPrefix.slice(0, -1) || alias.startsWith(aliasPrefix)) {
        const rest = alias.slice(aliasPrefix.length);
        return prefixed(joinParts(normalize(target.slice(0, -1)), rest));
      }
    } else if (pattern === alias) {
      return prefixed(normalize(target));
    }
  }

  return fallback;
}

/**
 * Path a registry file is written to, relative to the project root.
 *
 * Each registry type selects the alias it is written under — `ui`, `lib`, `hooks`
 * — matching how the shadcn CLI resolves the same item.
 *
 * `cn` is the exception: its location is pinned by an alias other than the
 * directory it nominally lives in, because components import it through `utils`,
 * which a project may point somewhere other than `<lib>/utils`. Writing it under
 * `lib` in that case leaves every component importing a file that does not exist.
 */
export function resolveFileDestination(
  filePath: string,
  fileType: string,
  aliases: Record<string, string>,
  config: TsPathsConfig | null,
): string {
  const toDir = (alias: string) => resolveAliasToDir(alias, config);

  if (filePath.replace(/^lib\//, "") === "utils.ts") {
    return `${toDir(aliases.utils)}.ts`;
  }

  const dir =
    fileType === "registry:lib"
      ? toDir(aliases.lib)
      : fileType === "registry:hook"
        ? toDir(aliases.hooks)
        : fileType === "registry:ui"
          ? toDir(aliases.ui)
          : toDir(aliases.components);

  return [dir, filePath.replace(/^(components|lib|ui|hooks)\//, "")].filter(Boolean).join("/");
}
