import { describe, expect, it } from "vitest";
import {
  parseJsonc,
  resolveAliasToDir,
  resolveFileDestination,
  type TsPathsConfig,
} from "@/cli/paths";

const srcLayout: TsPathsConfig = { baseUrl: ".", paths: { "@/*": ["./src/*"] } };
const rootLayout: TsPathsConfig = { baseUrl: ".", paths: { "@/*": ["./*"] } };

describe("resolveAliasToDir", () => {
  it("maps @/* to src/* — the Next.js default layout", () => {
    expect(resolveAliasToDir("@/components", srcLayout)).toBe("src/components");
    expect(resolveAliasToDir("@/components/ui", srcLayout)).toBe("src/components/ui");
    expect(resolveAliasToDir("@/lib", srcLayout)).toBe("src/lib");
  });

  it("maps @/* to the project root when that is how it is configured", () => {
    expect(resolveAliasToDir("@/components", rootLayout)).toBe("components");
    expect(resolveAliasToDir("@/lib", rootLayout)).toBe("lib");
  });

  it("honours baseUrl", () => {
    const config: TsPathsConfig = { baseUrl: "./app", paths: { "@/*": ["./modules/*"] } };
    expect(resolveAliasToDir("@/components", config)).toBe("app/modules/components");
  });

  it("prefers the most specific pattern", () => {
    const config: TsPathsConfig = {
      baseUrl: ".",
      paths: { "@/*": ["./src/*"], "@/lib/*": ["./packages/shared/*"] },
    };
    expect(resolveAliasToDir("@/lib/utils", config)).toBe("packages/shared/utils");
    expect(resolveAliasToDir("@/components", config)).toBe("src/components");
  });

  it("supports exact, non-wildcard mappings", () => {
    const config: TsPathsConfig = { baseUrl: ".", paths: { "@ui": ["./design/system"] } };
    expect(resolveAliasToDir("@ui", config)).toBe("design/system");
  });

  it("falls back to stripping @/ when there is no tsconfig", () => {
    expect(resolveAliasToDir("@/components", null)).toBe("components");
    expect(resolveAliasToDir("~/components", null)).toBe("~/components");
  });

  it("falls back when no pattern matches the alias", () => {
    expect(resolveAliasToDir("@/components", { baseUrl: ".", paths: { "#/*": ["./x/*"] } })).toBe(
      "components",
    );
  });
});

describe("parseJsonc", () => {
  it("parses plain JSON", () => {
    expect(parseJsonc('{"a":1}')).toEqual({ a: 1 });
  });

  it("tolerates comments and trailing commas, which tsconfig allows", () => {
    const raw = `{
      // a line comment
      "compilerOptions": {
        /* a block comment */
        "baseUrl": ".",
        "paths": { "@/*": ["./src/*"] },
      },
    }`;
    expect(parseJsonc(raw)).toEqual({
      compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] } },
    });
  });

  it("does not strip comment-like sequences inside strings", () => {
    expect(parseJsonc('{"url":"https://x.dev/a"}')).toEqual({ url: "https://x.dev/a" });
  });

  it("returns null on malformed input instead of throwing", () => {
    expect(parseJsonc("{nope")).toBeNull();
  });
});

describe("resolveFileDestination", () => {
  const defaults = {
    components: "@/components",
    ui: "@/components/ui",
    lib: "@/lib",
    utils: "@/lib/utils",
    hooks: "@/hooks",
  };

  it("writes ui items under the ui alias", () => {
    expect(
      resolveFileDestination("ui/language-switcher.tsx", "registry:ui", defaults, srcLayout),
    ).toBe("src/components/ui/language-switcher.tsx");
  });

  it("honours a relocated ui alias, as the shadcn CLI does", () => {
    const custom = { ...defaults, ui: "@/design/widgets" };
    expect(resolveFileDestination("ui/navbar.tsx", "registry:ui", custom, srcLayout)).toBe(
      "src/design/widgets/navbar.tsx",
    );
    // The shared types file has to land beside the components that import "./types".
    expect(resolveFileDestination("ui/types.ts", "registry:ui", custom, srcLayout)).toBe(
      "src/design/widgets/types.ts",
    );
  });

  it("writes hooks under the hooks alias", () => {
    expect(resolveFileDestination("hooks/use-thing.ts", "registry:hook", defaults, srcLayout)).toBe(
      "src/hooks/use-thing.ts",
    );
  });

  it("falls back to the components alias for an unknown type", () => {
    expect(
      resolveFileDestination(
        "components/ui/language-switcher.tsx",
        "registry:component",
        defaults,
        srcLayout,
      ),
    ).toBe("src/components/ui/language-switcher.tsx");
  });

  it("writes lib files under the lib alias", () => {
    expect(
      resolveFileDestination("lib/use-controllable-state.ts", "registry:lib", defaults, srcLayout),
    ).toBe("src/lib/use-controllable-state.ts");
  });

  it("writes cn to the utils alias, which the rewritten imports point at", () => {
    // A project may alias `utils` away from `<lib>/utils`; putting the file under
    // lib anyway leaves every component importing a path that does not exist.
    const custom = { ...defaults, utils: "@/helpers/cn" };
    expect(resolveFileDestination("lib/utils.ts", "registry:lib", custom, srcLayout)).toBe(
      "src/helpers/cn.ts",
    );
  });

  it("leaves the default utils location unchanged", () => {
    expect(resolveFileDestination("lib/utils.ts", "registry:lib", defaults, srcLayout)).toBe(
      "src/lib/utils.ts",
    );
  });
});
