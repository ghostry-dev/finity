<div align="center">

<picture><img src="https://docs.ghostry.dev/logo.png" alt="ghostry" width="96" height="96"></picture>

# @ghostry/finity-core

**The framework-agnostic core of finity, for adapting it to another framework.**

[![npm](https://img.shields.io/badge/npm-ffffff.svg?style=for-the-badge&color=000000&logo=npm&logoColor=CB3837)](https://www.npmjs.com/package/@ghostry/finity-core)
[![npmx](https://img.shields.io/badge/npmx-ffffff.svg?style=for-the-badge&color=000000&logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTMiIGhlaWdodD0iMTUzIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxNTMgMTUzIj4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxNi43MDQgOS45ODI3KSI+CiAgICA8cGF0aCBkPSJtMC45MzQ3NiA5Ny4yMDVoMjQuMDgxdjIzLjY5M2gtMjQuMDgxeiIgZmlsbD0iI2ZmZiI+PC9wYXRoPgogICAgPHBhdGggZD0ibTEwMy4xMi05LjIzMDctMy42MjExIDEwLjI0Ni00Ni4zMDkgMTMxLTMuNjIxMSAxMC4yNDZoMTUuNTM3bDMuNjIxMS0xMC4yNDYgMTEuNzE3LTMzLjE0OCAzOC4yMTEtMTA4LjF6IiBmaWxsPSIjNTFjOGZjIj48L3BhdGg+CiAgPC9nPgo8L3N2Zz4K&logoColor=51C8FC)](https://npmx.dev/package/@ghostry/finity-core)
[![jsr](https://img.shields.io/badge/jsr-ffffff?style=for-the-badge&color=000000&logo=jsr&logoColor=F7DF1E)](https://jsr.io/@ghostry/finity-core)
[![github](https://img.shields.io/badge/github-ffffff?style=for-the-badge&color=000000&logo=github&logoColor=ffffff)](https://github.com/ghostry-dev/finity)
<picture><img alt="typescript" src="https://img.shields.io/badge/typescript-ffffff?style=for-the-badge&color=000000&logo=typescript&logoColor=3178C6"></picture>
<picture><img alt="bun" src="https://img.shields.io/badge/bun-ffffff?style=for-the-badge&color=000000&logo=bun&logoColor=FBF0DF"></picture>
<picture><img alt="node" src="https://img.shields.io/badge/node-ffffff?style=for-the-badge&color=000000&logo=nodedotjs&logoColor=5FA04E"></picture>

[**Documentation**](https://docs.ghostry.dev/finity) &nbsp;·&nbsp; [**Other frameworks**](https://docs.ghostry.dev/finity/frameworks/custom) &nbsp;·&nbsp; [**API Reference**](https://docs.ghostry.dev/finity/reference/api)

</div>

> [!WARNING]
> v0 is in active development, and breaking changes occur frequently. Read the [changelog](https://docs.ghostry.dev/finity/changelog/finity) before every update.

For React or Solid, install [`@ghostry/finity-reactjs`](https://www.npmjs.com/package/@ghostry/finity-reactjs) or [`@ghostry/finity-solidjs`](https://www.npmjs.com/package/@ghostry/finity-solidjs) instead. Both are built on this package.

## Install

```bash
npm install @ghostry/finity-core
```

## Example

`initialize` takes one adapter over your framework's state, and builds the rest of finity on it:

```ts
import { initialize, type Getter, type Setter } from "@ghostry/finity-core";

export const finity = initialize({
  useState: <T extends {}>(initial: () => T): [Getter<T>, Setter<T>] => {
    const store = createStore(initial());
    const set = (next: T | ((previous: T) => T)) => {
      const value = next instanceof Function ? next(store.get()) : next;
      store.set(value);
      return value;
    };
    return [store.get, set as Setter<T>];
  },
});
```

`createStore` stands in for your framework's own state. Core has no `useRender`, since rendering belongs to the framework, and its `useEffect(...).use()` runs immediately, so call it from your framework's own effect. See [Other frameworks](https://docs.ghostry.dev/finity/frameworks/custom).

## License

[MIT](LICENSE) © Patrick Rebsch
