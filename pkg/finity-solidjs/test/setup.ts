/**
 * Preloaded before every test file (see `bunfig.toml`). Solid's tests need two
 * things Bun doesn't provide:
 *
 * - A DOM, which Solid Testing Library renders into.
 * - Solid's JSX transform. Bun compiles JSX to `jsx()` calls, as React does, but
 *   Solid compiles it to DOM operations with `babel-preset-solid`. So `.tsx`
 *   files load through Babel instead.
 *
 * The tests also need `solid-js`'s browser build, which only the `browser`
 * export condition selects, so `bun test` runs with `--conditions browser`.
 *
 * @module
 */

import { transformAsync } from "@babel/core";
import presetTypescript from "@babel/preset-typescript";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import presetSolid from "babel-preset-solid";

GlobalRegistrator.register();

Bun.plugin({
  name: "solid-jsx",
  setup(build) {
    build.onLoad({ filter: /\.tsx$/ }, async ({ path }) => {
      const result = await transformAsync(await Bun.file(path).text(), {
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
