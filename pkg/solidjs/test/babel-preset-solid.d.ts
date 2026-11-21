/**
 * `babel-preset-solid` ships no types. This covers the one use `setup.ts` makes
 * of it: passing the preset itself, rather than its name, to Babel.
 */
declare module "babel-preset-solid" {
  import type { PresetAPI, PresetObject } from "@babel/core";

  const preset: (
    api: PresetAPI,
    options: { generate?: "dom" | "ssr" | "universal" },
  ) => PresetObject;
  export default preset;
}
