import { defineConfig } from "@rslib/core";
import base from "../../rslib.shared.config.ts";

/**
 * The build needs no Solid plugin: `src/` has no JSX, since compiled JSX
 * imports a renderer that differs between Solid 1 and Solid 2. Only the tests'
 * `.tsx` files are compiled for Solid, by `test/setup.ts`, which is why
 * `@solidjs/compiler` and `babel-preset-solid` are devDependencies.
 */
export default defineConfig(base);
