import { ExhaustiveSwitchInstance, FinityError } from "../src/index.ts";
import { expect, test } from "./index.ts";

test("a state that no case handles is an error", () => {
  const unhandled = new ExhaustiveSwitchInstance<string, { kind: string }>(
    () => ({ kind: "Unknown" }),
    [[["Known"], () => "known"]],
  );

  let error: unknown;
  try {
    unhandled.use();
  } catch (e) {
    error = e;
  }

  expect(error).toBeInstanceOf(FinityError.UnhandledStateError);
  expect((error as FinityError.UnhandledStateError).kind).toBe("Unknown");
});
