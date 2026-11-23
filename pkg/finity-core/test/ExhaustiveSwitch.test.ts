import { ExhaustiveSwitchInstance, FinityError } from "../src/index.ts";
import { attest, expect, test } from "./index.ts";

test("a state that no case handles is an error", () => {
  const unhandled = new ExhaustiveSwitchInstance<string, { kind: string }>(
    () => ({ kind: "Unknown" }),
    [[["Known"], () => "known"]],
  );

  const error = attest.throws(FinityError.UnhandledStateError, () =>
    unhandled.use(),
  );

  expect(error.kind).toBe("Unknown");
});
