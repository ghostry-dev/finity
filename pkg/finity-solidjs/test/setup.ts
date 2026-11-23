/**
 * Preloaded before every test file (see `bunfig.toml`). The suite runs once
 * against Solid 2, and again against Solid 1 when `FINITY_SOLID=1`, and needs
 * things Bun doesn't provide:
 *
 * - A DOM, which Solid Testing Library renders into.
 * - Solid's JSX transform. Bun compiles JSX to `jsx()` calls, as React does, but
 *   Solid compiles it to DOM operations, so `.tsx` files load through Solid's
 *   compiler instead: `@solidjs/compiler` for Solid 2, Babel with
 *   `babel-preset-solid` for Solid 1.
 * - For Solid 1, `solid-js`, `solid-js/web`, and Solid Testing Library replaced
 *   by their 1.x copies, installed under aliases. A mocked module is replaced
 *   for every importer, including the package's `dist/` and other packages, so
 *   that a single Solid runs. Bun's runtime plugins can't do this: their
 *   `onResolve` isn't called for packages.
 *
 * The tests also need Solid's browser build, which only the `browser` export
 * condition selects, so `bun test` runs with `--conditions browser`. The
 * `development` condition selects its development build, which reports misuse
 * that the production build lets pass.
 *
 * @module
 */

import { transformAsync } from "@babel/core";
import presetTypescript from "@babel/preset-typescript";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { transform } from "@solidjs/compiler";
import presetSolid from "babel-preset-solid";
import { mock } from "bun:test";

GlobalRegistrator.register();

const solid1 = process.env["FINITY_SOLID"] === "1";

if (solid1) {
  const solid = await import("solid-js-1");
  const web = await import("solid-js-1/web");
  mock.module("solid-js", () => solid);
  mock.module("solid-js/web", () => web);

  // Imported once Solid is replaced, since it imports Solid itself.
  const testingLibrary = await import("solid-js-1-testing-library");
  mock.module("@solidjs/testing-library", () => testingLibrary);
}

Bun.plugin({
  name: "solid-jsx",
  setup(build) {
    build.onLoad({ filter: /\.tsx$/ }, async ({ path }) => {
      const source = await Bun.file(path).text();

      if (!solid1) {
        const { code } = transform(source, { filename: path, generate: "dom" });
        // The compiler leaves TypeScript's syntax in place.
        return { contents: code, loader: "ts" };
      }

      const result = await transformAsync(source, {
        filename: path,
        babelrc: false,
        configFile: false,
        // Passed as modules, not names: Babel resolves preset names relative
        // to the working directory, which needn't be this package.
        presets: [[presetSolid, { generate: "dom" }], presetTypescript],
        parserOpts: { plugins: ["jsx", "typescript"] },
      });
      if (!result?.code) throw new Error(`Babel produced no code for ${path}`);
      return { contents: result.code, loader: "js" };
    });
  },
});
