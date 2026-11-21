# finity — architecture notes

Context for working on this codebase. It isn't user-facing: it says how the packages fit together and where the traps are.

## Packages

| Package                   | Path          | What it is                                                                                                                    |
| ------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `@ghostry/finity-core`    | `pkg/core`    | The framework-agnostic state machine. It needs a state primitive (`useState`) from its caller, so it does nothing on its own. |
| `@ghostry/finity-reactjs` | `pkg/reactjs` | Supplies React's `useState` to core and adds `useRender`.                                                                     |
| `@ghostry/finity-solidjs` | `pkg/solidjs` | Supplies Solid's `createSignal` to core and adds `useRender`, built on its internal `Render` component.                       |

- The three packages share one version and release together under one bare `vX.Y.Z` tag. The root `package.json` carries that version, and `main.yml` reads it from there. So a release bumps all four `package.json` files and the three `jsr.json` files together. Because of this, finity keeps its own workflows: sync doesn't generate them, and `test.yml` lists the packages by hand.
- The framework packages re-export core's errors and define none of their own, so every error `name` starts with `@ghostry/finity-core`.
- `rslib.shared.config.ts` holds the build settings all three share. Each package's `rslib.config.ts` extends it and adds its framework's plugin.

## Tests

- core's behavior is exercised through the framework packages, which supply the state primitive. core's own tests cover only what it defines alone, such as its errors.
- The React and Solid tests import their package by name, so they run against `dist/`. Build before running a package's `bun test` on its own. The root `test` builds first.
- Each framework package's `bunfig.toml` preloads `test/setup.ts`, which registers happy-dom as the DOM.
- Bun compiles JSX for React, not Solid. So Solid's `test/setup.ts` also registers a `Bun.plugin` that loads `.tsx` files through Babel with `babel-preset-solid`. The preset modules are passed to Babel as imports, not names, because Babel resolves names from the working directory.
- Solid's `test` script runs `bun test --conditions browser`. Without that condition, `solid-js` loads its server build, which doesn't run effects, and most of the tests fail.

<!-- @ghostry:shared:start
     Managed by the @ghostry meta repo (.templates/blocks/agents.*.md); edit
     it there. -->

## @ghostry conventions

These apply to every @ghostry repo. This repo is checked out inside the @ghostry meta repo (its parent directory), which holds the shared config, workflows, and agent skills in `../.agents/skills/`. Change shared files there, never here.

- Bun only: `bun install`, `bun run …`, `bun test`, `bun x …`. Never `npm`, `npx`, or `node`.
- Format with oxfmt. Its config, `.oxfmtrc.jsonc`, is shared.
- Comments are TypeDoc-style `/** */` and explain _why_ (a constraint, an invariant, a workaround), never restate _what_ the code already says.
- AGENTS.md describes present-state facts and invariants, never change history. State the current behavior and the trap directly; git history holds the rest.

### Libraries

- Scripts: every package has `build` (with its `build:*` steps, declarations emitted by TypeScript 5 in `build:types`), `build:rsdoctor`, `typecheck` (TypeScript 7), `typecheck:ts5`, `typecheck:jsr` (`jsr publish --dry-run`, which fails on slow types and prints the file list), `format`, and `test`, which runs the three type checks and then `bun test` without building. A single-package repo adds `verify`, which builds and then tests. A monorepo root runs `build`, `typecheck`, `typecheck:ts5`, `typecheck:jsr`, and `test` across its packages in publish order, and its `test` builds first.
- Type-check under both TypeScript 7 (`typecheck`) and TypeScript 5 (`typecheck:ts5`, where a package defines it). Both must pass: TS7's type-instantiation budget is far larger than TS5's, and most consumers are on 5.x.
- `tsconfig.base.json` holds the shared compiler options. In particular, `verbatimModuleSyntax` is on, so type-only imports say `import type` (or `type` on individual specifiers), and `exactOptionalPropertyTypes` is on. A package's own `tsconfig.json` extends the base and adds only what is specific to it.
- Every relative import names its file, `.ts` extension included: `"./Types.ts"`, and `"./Thing/index.ts"` for a directory, never `"./Thing"`. Declaration emit copies imports as written, and a consumer on `moduleResolution: node16`/`nodenext` needs the extension.
- `jsr publish` ships every non-gitignored file in the package directory, dotfiles included. So every package's `jsr.json` lists what to publish with an allowlist, `"publish": { "include": ["src", "README.md", "LICENSE", "jsr.json"] }`, never a denylist, which leaks whatever it forgets: `.github/` and `.bun-version` at a repo root, `rslib.config.ts`, `tsconfig*.json`, and `package.json` in every package. JSR rewrites bare imports to `jsr:`/`npm:` specifiers at publish, so the published files need no `package.json`. A package under `pkg/` gets its own copy of LICENSE from sync, since npm and JSR publish the directory alone. `bun run typecheck:jsr` prints the exact file list.
- A `#` subpath import in `package.json` has no `deno` condition, and every runtime target names a file under `dist/`; only `types` may point at `src/`. npm ships `dist` alone, and Deno resolves an npm package's `imports` with the `deno` condition first, so a `deno` target in `src/` fails to load from npm. Without one, Deno falls through to `node` and `dist/`, and it accepts the bare built-in specifier rslib emits there (`async_hooks` for `node:async_hooks`) inside an npm package. JSR ships source and resolves `#` specifiers once, at publish, so `jsr.json` maps each one that `src/` imports to its source file under `imports` (`"#stack": "./src/Instance/Stack/Async.ts"`); without the map, `jsr publish` fails, since the graph reaches the gitignored `dist/`. A test-only one, such as `#internal/*` mapped to `dist/`, needs no map.
- Tests: every test file takes its runner from its package's `test/index.ts`, imported as `"./index.ts"` (`"../index.ts"` from a subdirectory), never from `bun:test`. That module wraps `bun:test` with `@ghostry/harness`, a devDependency, and exports `describe`, `it`/`test`, the hooks the package uses, `expect`, and `attest`, annotated as `Attest` since an assertion can't narrow through a destructure (TS2775). Anything harness doesn't wrap, such as `expectTypeOf` or `spyOn`, is re-exported from `bun:test` there. Under harness, a `.each` row reaches the body as `row` on the context, and a `describe` callback is synchronous unless it takes the suite scope. harness tests its own wrapping against `bun:test` directly.
- Errors: every error a package throws is a subclass of one abstract base, `<Name>Error extends Error`. The subclasses live in a namespace with the same name (`AsterError.DuplicateRuleError`), in one module with no runtime imports. Each `name` is the npm package name and the class, joined by `:`, as in `"@ghostry/aster:DuplicateRuleError"`, and the base's is `"@ghostry/aster:AsterError"`. A name identifies an error where `instanceof` can't: across two installed copies of a package, or after serialization. The separator is `:`, not `/`, which would read as a subpath export. A companion package's base extends its parent's base (`CensusError extends FabricatorError`) and still names its own package. Context goes in `public readonly` constructor parameters, and the message makes sense without them. A test asserts every error's `name`. Changing a `name` is a **Behavior change** in the release notes.
- Releasing: bumping a package's `version` in a commit to `main` publishes it to npm and JSR and creates its GitHub release, with an empty body. Write the release notes afterwards with the meta repo's `release-notes` skill, following its `.release-notes/FORMAT.md`.

<!-- @ghostry:shared:end -->
