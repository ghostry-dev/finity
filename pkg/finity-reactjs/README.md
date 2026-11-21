<div align="center">

<picture><img src="https://docs.ghostry.dev/logo.png" alt="ghostry" width="96" height="96"></picture>

# @ghostry/finity-reactjs

**Finite state with exhaustive cases and enforced transitions, for React.**

Declare a component's states and which state may follow which. TypeScript then rejects a missing case and a transition you didn't declare, and finity reports a stale one at runtime.

[![npm](https://img.shields.io/badge/npm-ffffff.svg?style=for-the-badge&color=000000&logo=npm&logoColor=CB3837)](https://www.npmjs.com/package/@ghostry/finity-reactjs)
[![npmx](https://img.shields.io/badge/npmx-ffffff.svg?style=for-the-badge&color=000000&logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTMiIGhlaWdodD0iMTUzIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAxNTMgMTUzIj4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxNi43MDQgOS45ODI3KSI+CiAgICA8cGF0aCBkPSJtMC45MzQ3NiA5Ny4yMDVoMjQuMDgxdjIzLjY5M2gtMjQuMDgxeiIgZmlsbD0iI2ZmZiI+PC9wYXRoPgogICAgPHBhdGggZD0ibTEwMy4xMi05LjIzMDctMy42MjExIDEwLjI0Ni00Ni4zMDkgMTMxLTMuNjIxMSAxMC4yNDZoMTUuNTM3bDMuNjIxMS0xMC4yNDYgMTEuNzE3LTMzLjE0OCAzOC4yMTEtMTA4LjF6IiBmaWxsPSIjNTFjOGZjIj48L3BhdGg+CiAgPC9nPgo8L3N2Zz4K&logoColor=51C8FC)](https://npmx.dev/package/@ghostry/finity-reactjs)
[![jsr](https://img.shields.io/badge/jsr-ffffff?style=for-the-badge&color=000000&logo=jsr&logoColor=F7DF1E)](https://jsr.io/@ghostry/finity-reactjs)
[![github](https://img.shields.io/badge/github-ffffff?style=for-the-badge&color=000000&logo=github&logoColor=ffffff)](https://github.com/ghostry-dev/finity)
<picture><img alt="typescript" src="https://img.shields.io/badge/typescript-ffffff?style=for-the-badge&color=000000&logo=typescript&logoColor=3178C6"></picture>
<picture><img alt="bun" src="https://img.shields.io/badge/bun-ffffff?style=for-the-badge&color=000000&logo=bun&logoColor=FBF0DF"></picture>
<picture><img alt="node" src="https://img.shields.io/badge/node-ffffff?style=for-the-badge&color=000000&logo=nodedotjs&logoColor=5FA04E"></picture>
<picture><img alt="react" src="https://img.shields.io/badge/react-ffffff?style=for-the-badge&color=000000&logo=react&logoColor=61DAFB"></picture>

[**Documentation**](https://docs.ghostry.dev/finity) &nbsp;·&nbsp; [**React guide**](https://docs.ghostry.dev/finity/frameworks/react) &nbsp;·&nbsp; [**API Reference**](https://docs.ghostry.dev/finity/reference/api)

</div>

> [!WARNING]
> v0 is in active development, and breaking changes occur frequently. Read the [changelog](https://docs.ghostry.dev/finity/changelog/finity-reactjs) before every update.

## Install

```bash
npm install @ghostry/finity-reactjs
```

## Example

```tsx
import { initialize, type TransitionalStates } from "@ghostry/finity-reactjs";
import { useEffect } from "react";

const finity = initialize({});

const SignIn = finity
  .defineTransitionalState<{
    SignedOut: {};
    SigningIn: { username: string; password: string };
    Rejected: { username: string };
    SignedIn: { username: string };
  }>("SignIn")
  .transitions({
    SignedOut: ["SigningIn"],
    SigningIn: ["SignedIn", "Rejected"],
    Rejected: ["SigningIn"],
    SignedIn: [],
  });

type SignIns = TransitionalStates<typeof SignIn>;

export function SignInPage() {
  const state = finity.useStrictlyTransitionalState(SignIn, () => ({
    kind: "SignedOut",
  }));

  return finity
    .useRender(state.value)
    .case(["SignedOut", "Rejected"], ({ transition }) => (
      <SignInForm
        onSubmit={(credentials) =>
          transition({ kind: "SigningIn", ...credentials })
        }
      />
    ))
    .case(["SigningIn"], (signingIn) => <SigningIn state={signingIn} />)
    .case(["SignedIn"], ({ username }) => <p>Welcome, {username}.</p>)
    .use();
}

function SigningIn({ state }: { state: SignIns["SigningIn"] }) {
  useEffect(() => {
    const { username, password, transition } = state;
    api
      .signIn(username, password)
      .then(() => transition({ kind: "SignedIn", username }))
      .catch(() => transition({ kind: "Rejected", username }));
  }, [state]);

  return <p>Signing in…</p>;
}
```

`api` and `SignInForm` stand in for your own code. See the [docs site](https://docs.ghostry.dev/finity) for the full guide.

## States, not flags

A component is in exactly one named state, and each state carries only the data it has. No `isLoading` beside an `error` that might be stale. See [Mental model](https://docs.ghostry.dev/finity/start/mental-model).

## Transitions you declare

Each state lists the states that may follow it. A transition you didn't declare doesn't compile, and a terminal state has no transitions at all. See [Defining states](https://docs.ghostry.dev/finity/guides/defining-states).

## Every case handled

`useRender` takes one case per state, and its chain only ends when every state is handled. A new state is a type error everywhere it's missing. See [Rendering](https://docs.ghostry.dev/finity/guides/rendering).

## Stale transitions refused

A transition from a state the component has already left is ignored and reported, so a slow request can't overwrite a newer state. See [Invalid transitions](https://docs.ghostry.dev/finity/guides/invalid-transitions).

## License

[MIT](LICENSE) © Patrick Rebsch
