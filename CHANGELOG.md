# Changelog

All notable changes to Babelize Elements will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

From `1.1.0` onward, release notes live in
[GitHub Releases](https://github.com/babelize/babelize-elements/releases) — a release
is published by creating a tag there, and the notes are written at that point.
Everything below is retained history.

## [1.1.4] - 2026-09-17

### Fixed

- `LanguageSwitcher`: RTL rows were reversed twice. Each option already carried
  `dir="rtl"`, which lays a flex row out right-to-left on its own; the
  `flex-row-reverse` applied on top put it back into left-to-right order. The
  trigger reversed itself the same way, and `text-left` pinned the label against
  the direction.
- `LanguageSwitcher`: the root element never carried `dir`, so an RTL locale did
  not set the direction for its own subtree. It does now, and a caller can still
  override it by passing `dir`.

### Removed

- Two orphaned landing-page components (`hero-demo`, `theme-toggle`), the unused
  `registryItemNames` export, and the unused `geist` dependency. Registry
  constants that are only read inside the module are no longer exported.

## [1.1.3] - 2026-09-17

### Removed

- **Breaking:** `PhoneInput`'s deprecated `onChange` and `showFlag` props. Use
  `onValueChange` and `showFlags`. Same caveat as below — a patch release, so a
  `^1.1.0` range picks it up and the old props fail silently rather than loudly.
- **Breaking:** `NavBar`'s deprecated `currentLocale` and `onLocaleChange` props.
  Use `value` and `onValueChange` instead. Shipped in a patch release by
  maintainer decision, so a version range like `^1.1.0` picks it up
  automatically: code still passing the old props type-checks and compiles, but
  silently stops tracking the locale. Update both call sites together.

### Fixed

- The published bundle lost the `"use client"` directive, so importing the
  package from a React Server Component crashed the build with
  `useState is not a function`. The directive is now emitted in both the ESM and
  CJS output, and the packaging smoke test asserts it.
- `exports` declared no `require` types condition, leaving `dist/index.d.cts`
  unreachable for CommonJS consumers.
- `NavBar`: picking a language from the mobile bar did nothing — the outside-click
  handler only guarded the desktop container, so it closed the menu before the
  option's click landed.
- `NavBar`: the language menu mounted two listboxes into the accessibility tree at
  once, because the desktop and mobile bars are both always in the DOM.
- `NavBar`: the mobile menu toggle had no `type="button"` (submitting any
  enclosing form) and no `aria-expanded`.
- `NavBar`: closing the mobile menu cleared `body.overflow` instead of restoring
  the page's own value.
- `NavBar`: `Escape` now closes the language menu and the mobile panel.
- `NavBar`: an uncontrolled bar defaulted to `"en"` even when `locales` did not
  contain it; it now falls back to the first locale, matching `LanguageSwitcher`.
- `PhoneInput`: the country search box shared a ref with the phone field, so the
  forwarded ref pointed at the search input whenever the dropdown was open, and
  picking a country moved focus to an element that was about to unmount instead of
  back to the number field.
- `PhoneInput` / `LanguageSwitcher`: the search boxes had no accessible name.
- Docs: the TypeScript interfaces page documented `PhoneInput`'s deprecated
  `onChange` as the callback to use and omitted `value` / `defaultValue`.
- Docs site: the copy buttons left a pending timer behind on unmount.
- Registry: components were published as `registry:component`, the one type the
  shadcn CLI does *not* resolve against the consumer's `ui` alias, so they were
  forced into `<components>/ui` whatever the project had configured. They are now
  `registry:ui`, matching how shadcn publishes its own components.
- Registry: `utils` is no longer a `registryDependency` of any component. Listing it
  made the shadcn CLI write `cn` into the `lib` directory while rewriting the import
  to the `utils` alias — an unresolvable import in any project that points `utils`
  elsewhere, and a silent overwrite of the project's own `cn` in every other case.
  Components now assume `cn` exists, as shadcn's own components do.
- CLI: writes each file to the alias its type selects (`ui`, `lib`, `hooks`) instead
  of forcing everything under `components`, and installs `cn` itself only when the
  file is genuinely missing — never over an existing one.

### Added

- `@babelize/elements/utils` — the `cn` helper without the `"use client"`
  directive, so server components can call it.
- Installation docs now cover the Tailwind `@source` / `content` step the npm
  package needs; without it every component renders unstyled.
- An Open Graph / Twitter card image, which the site previously declared
  `summary_large_image` for without ever supplying one.

## [1.0.1] - [1.0.16] - 2026-08-15 to 2026-08-23

These sixteen releases were published automatically, one npm patch per push to
`main`, by a workflow that always bumped the patch digit regardless of what
changed. No entries were recorded at the time; this is a backfill from the
git history, and the version boundaries reflect where the auto-bump landed rather
than any deliberate release. `1.0.2` through `1.0.8` shipped no source changes at
all — they were retries while the publish workflow was being debugged.

Note that every one of these releases was **broken on npm**: the library build
emitted an unresolvable `@/lib/utils` import, so importing the package failed. See
`1.1.0` for the fix.

### Added

- `PhoneInput` and `NavBar` components, with docs pages (`1.0.14`)
- shadcn-compatible component registry (`/r/[name].json`, `/registry.json`) and a
  bundled CLI — `npx @babelize/elements add <component>` / `list` (`1.0.16`)
- Components catalog page under `/docs/components` (`1.0.12`)
- Contributors section in the README (`1.0.16`)

### Changed

- Components restyled with plain Tailwind classes instead of CSS-variable design
  tokens; the theme gallery, theme-switcher demos, and theming docs were removed
  (`1.0.13`, `1.0.14`)
- Installation instructions and component usage examples rewritten for the npm
  package (`1.0.1`, `1.0.11`, `1.0.16`)

### Fixed

- Broken links and leftover copy-paste references in the docs (`1.0.1`, `1.0.11`)
- Docs sidebar keys and the "Browse Components" destination (`1.0.12`)
- Lint failures breaking CI (`1.0.15`)
- Publish pipeline: npm auth token wiring, `[skip ci]` to stop an infinite publish
  loop, duplicate publish step, `workflow_dispatch` for manual runs (`1.0.1`,
  `1.0.9`, `1.0.10`)

## [1.0.0] - 2026-08-15

### Added

- Initial stable release of `@babelize/elements` npm package
- LanguageSwitcher component with dropdown, search, RTL support, and full accessibility
- TypeScript-first with exported interfaces for all props
- Works with next-intl, react-i18next, react-intl, and custom i18n setups
- Dark mode support built-in with Tailwind CSS
- 60+ supported languages with auto-detected labels and flags
- Documentation site at elements.babelize.co
- Installation guide with npm, pnpm, yarn, and bun instructions
- Theming guide with CSS variables and theme gallery
- Contributing guide for community contributors
- Auto-publish workflow for continuous releases

## [0.2.0] - 2026-08-15

### Minor Changes

- Add installation page and fix sidebar icons in getting-started docs

## [0.1.0] - 2026-08-04

### Added

- Initial repository setup
- Next.js 16.3.0 + Fumadocs 16
- Tailwind CSS v4
- MIT License
- Contributing guide and Code of Conduct
- Landing page with billingsdk.com-inspired design
- Fumadocs documentation site with getting-started and contributing guides
- Component showcase with live demos (Pill Switcher, Dropdown Picker, RTL Layout, Date Formatter, Translation Widget)
- FAQ section with accordion UI
- `llms.txt` and `llms-full.txt` for LLM-friendly documentation
- SEO/AEO/GEO content optimization across all sections
- OpenGraph and Twitter card metadata
- JSON-LD structured data support

### Fixed

- Favicon SVG convention for Next.js 16
- Hydration mismatch from `next-themes`
- ESLint errors across all landing page components
- TypeScript errors in CI (LayoutProps import, fumadocs virtual module resolution)
