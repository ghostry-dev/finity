/**
 * Preloaded before every test file (see `bunfig.toml`): gives Bun a DOM, which
 * React Testing Library renders into.
 *
 * @module
 */

import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
