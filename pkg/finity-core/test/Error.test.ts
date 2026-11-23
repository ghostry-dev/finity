import * as Exports from "../src/index.ts";
import { FinityError } from "../src/index.ts";
import { expect, test } from "./index.ts";

/**
 * Every error's `name` is `"@ghostry/finity-core:<class>"`, so it identifies
 * the error where `instanceof` cannot.
 */
const errors: ReadonlyArray<readonly [string, FinityError]> = [
  [
    "InvalidTransitionError",
    new FinityError.InvalidTransitionError({
      reason: "disallowed",
      state: { name: "Door", from: { kind: "Open" }, to: { kind: "Locked" } },
      tick: { current: 0, bound: 0 },
    }),
  ],
  ["UnhandledStateError", new FinityError.UnhandledStateError("Unknown")],
];

test.each(errors)(
  "%s is named with the package prefix",
  ({ row: [name, error] }) => {
    expect(error).toBeInstanceOf(FinityError);
    expect(error.name).toBe(`@ghostry/finity-core:${name}`);
    expect(error.constructor.name).toBe(name);
  },
);

test("every subclass in the namespace is covered", () => {
  expect(errors.map(([name]) => name).sort()).toEqual(
    Object.keys(FinityError).sort(),
  );
});

test("no error class is exported outside the namespace", () => {
  const exported = Object.keys(Exports);

  for (const name of Object.keys(FinityError)) {
    expect(exported).not.toContain(name);
  }
});
