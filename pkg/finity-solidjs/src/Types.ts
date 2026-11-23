import * as Core from "@ghostry/finity-core";

export interface Config extends Omit<Core.Config, "useState" | "useRef"> {}
