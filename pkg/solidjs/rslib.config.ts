import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginSolid } from "@rsbuild/plugin-solid";
import { defineConfig } from "@rslib/core";
import base from "../../rslib.shared.config.ts";

export default defineConfig({
  ...base,
  plugins: [pluginBabel({ include: /\.(?:jsx|tsx)$/ }), pluginSolid()],
});
