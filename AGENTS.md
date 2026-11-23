# finity — architecture notes

Context for working on this codebase. It isn't user-facing: it says how the packages fit together and where the traps are.

## Packages

| Package                   | Path                 | What it is                                                                                                                    |
| ------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `@ghostry/finity-core`    | `pkg/finity-core`    | The framework-agnostic state machine. It needs a state primitive (`useState`) from its caller, so it does nothing on its own. |
| `@ghostry/finity-reactjs` | `pkg/finity-reactjs` | Supplies React's `useState` to core and adds `useRender`.                                                                     |
| `@ghostry/finity-solidjs` | `pkg/finity-solidjs` | Supplies a Solid signal and a plain-object ref to core and adds `useRender`, for Solid 1 and Solid 2 from one build.          |

- Each package has its own version and releases on its own, tagged `<package>/vX.Y.Z` (`finity-core/v0.0.13`), like any @ghostry monorepo. The bare tags up to `v0.0.12` are older releases that each covered all three packages.
- finity-reactjs and finity-solidjs depend on finity-core as `workspace:*`, which publishes as the exact version in the workspace (`"0.0.13"`). So a finity-core release reaches React and Solid users only when those packages release too, and finity-core publishes first.
- The framework packages re-export core's errors and define none of their own, so every error `name` starts with `@ghostry/finity-core`.
- core keeps its own bookkeeping (each state's latest value and transition clock) in refs. `Config.useRef` supplies the framework's ref primitive, and without one core builds a ref on `useState` that it never sets, as React needs. finity-solidjs supplies a plain object, because Solid 2 reports a signal read while a component is set up. Both bindings omit `useState` and `useRef` from the `Config` their users pass.
- `rslib.shared.config.ts` holds the build settings all three share. Each package's `rslib.config.ts` extends it. React's adds its framework's plugin; Solid's adds none, since its source has no JSX. Solid's compilers (`@solidjs/compiler`, `babel-preset-solid`) are devDependencies for its tests' `.tsx` files only.

## Solid 1 and Solid 2

- `pkg/finity-solidjs/src/Solid.ts` holds everything that differs between the majors: the state primitive, the ref, and the effect. `isSolid2()` tells them apart at runtime by probing `createSignal`, which runs a function as a computation in Solid 2 and stores it as the value in Solid 1.
- Every module in `src/` imports only exports both majors have. A named import of an export only Solid 2 has, like `flush` or `onSettled`, fails to link on Solid 1. `src/` has no JSX, so nothing imports `solid-js/web` (Solid 1) or `@solidjs/web` (Solid 2). The element type is `ReturnType<Component>`, which is `JSX.Element` in Solid 1 and `Element` in Solid 2.
- The source is type-checked against Solid 2, so calls only Solid 1 accepts are cast in `Solid.ts`. The emitted declarations are checked against both: `build:verify` against Solid 2, and `build:verify:solid1` through `tsconfig.verify.solid1.json`, which maps `solid-js` to the `solid-js-1` alias.
- `createMemo` takes one argument here. Its second is the initial value in Solid 1 and options in Solid 2.
- Solid 2 takes what an effect's apply function or an `onSettled` callback returns as its cleanup, and throws on anything but a function. Wrap a callback whose body is an expression in a block.
- `useRender` renders each case untracked inside a memo and returns the memo. The `untrack` label makes Solid 2's development build report a read at the top of a case, as it does in a component.

## Tests

- core's behavior is exercised through the framework packages, which supply the state primitive. core's own tests cover only what it defines alone, such as its errors.
- The React and Solid tests import their package by name, so they run against `dist/`. Build before running a package's `bun test` on its own. The root `test` builds first.
- Each framework package's `bunfig.toml` preloads `test/setup.ts`, which registers happy-dom as the DOM.
- Solid's suite runs twice: `test:solid2`, then `test:solid1`, which sets `FINITY_SOLID=1`. In that run, `test/setup.ts` replaces `solid-js`, `solid-js/web`, and `@solidjs/testing-library` with their 1.x copies, installed as the `solid-js-1` and `solid-js-1-testing-library` aliases. It uses `mock.module`, which replaces a module for every importer, `dist/` and other packages included. Bun's runtime plugins can't do this, since their `onResolve` isn't called for packages.
- Test files reach APIs that differ between the majors through `test/index.ts` (`settle`, `resume`, `onMounted`, `watch`), never by name from `solid-js`. Solid 2 queues writes until it flushes, so a test calls `settle()` after a write and before reading.
- Bun compiles JSX for React, not Solid. So Solid's `test/setup.ts` also registers a `Bun.plugin` that loads `.tsx` files through Solid's compiler. For Solid 2, that's `@solidjs/compiler`, which leaves TypeScript's syntax in place, so the result loads as `ts`. For Solid 1, it's Babel with `babel-preset-solid` 1.x, whose modules are passed to Babel as imports, not names, because Babel resolves names from the working directory.
- Both runs pass `--conditions browser --conditions development`. Without `browser`, `solid-js` loads its server build, which doesn't run effects, and most of the tests fail. `development` loads Solid's development build, which reports misuse. `test/diagnostics.test.tsx` checks that finity's own reads and writes cause no reports.

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
- A `#` subpath import in `package.json` has no `deno` condition, and every runtime target names a file under `dist/`; only `types` may point at `src/`. npm ships `dist` alone, and Deno resolves an npm package's `imports` with the `deno` condition first, so a `deno` target in `src/` fails to load from npm. Without one, Deno falls through to `node` and `dist/`, where built-in imports keep their `node:` prefix (`node:async_hooks`), as Deno resolves them. JSR ships source and resolves `#` specifiers once, at publish, so `jsr.json` maps each one that `src/` imports to its source file under `imports` (`"#stack": "./src/Instance/Stack/Async.ts"`); without the map, `jsr publish` fails, since the graph reaches the gitignored `dist/`. A test-only one, such as `#internal/*` mapped to `dist/`, needs no map.
- Tests: every test file takes its runner from its package's `test/index.ts`, imported as `"./index.ts"` (`"../index.ts"` from a subdirectory), never from `bun:test`. That module wraps `bun:test` with `@ghostry/harness`, a devDependency, and exports `describe`, `it`/`test`, the hooks the package uses, `expect`, and `attest`, annotated as `Attest` since an assertion can't narrow through a destructure (TS2775). Anything harness doesn't wrap, such as `expectTypeOf` or `spyOn`, is re-exported from `bun:test` there. Under harness, a `.each` row reaches the body as `row` on the context, and a `describe` callback is synchronous unless it takes the suite scope. harness tests its own wrapping against `bun:test` directly.
- Errors: every error a package throws is a subclass of one abstract base, `<Name>Error extends Error`. The subclasses live in a namespace with the same name (`AsterError.DuplicateRuleError`), in one module with no runtime imports. Each `name` is the npm package name and the class, joined by `:`, as in `"@ghostry/aster:DuplicateRuleError"`, and the base's is `"@ghostry/aster:AsterError"`. A name identifies an error where `instanceof` can't: across two installed copies of a package, or after serialization. The separator is `:`, not `/`, which would read as a subpath export. A companion package's base extends its parent's base (`CensusError extends FabricatorError`) and still names its own package. Context goes in `public readonly` constructor parameters, and the message makes sense without them. A test asserts every error's `name`. Changing a `name` is a **Behavior change** in the release notes.
- Releasing: bumping a package's `version` in a commit to `main` publishes it to npm and JSR and creates its GitHub release, with an empty body. Write the release notes afterwards with the meta repo's `release-notes` skill, following its `.release-notes/FORMAT.md`.
- Docs: a change users can see (a new or changed API, a behavior change, a removal, a new requirement) updates the docs site in the same session, while its details are at hand, not at release time. It goes on the docs repo's `next/<library>` branch, whose open PR is merged once the release is on npm. The meta repo's `docs-update` skill covers the branch, the build, and the PR.

<!-- @ghostry:shared:end -->
