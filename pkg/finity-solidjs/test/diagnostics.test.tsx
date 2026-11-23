import { render } from "@solidjs/testing-library";
import { describe, expect, initialize, it, settle, spyOn } from "./index.ts";

const finity = initialize({});

const State = finity
  .defineTransitionalState<{ Loading: {}; Ready: { resource: number } }>(
    "MyState",
  )
  .transitions({ Loading: ["Ready"], Ready: ["Ready"] });

/**
 * Solid's development build reports misuse through the console. finity's own
 * reads and writes have to pass: in Solid 2, reading a signal while a component
 * is set up is reported, so finity's bookkeeping can't live in one.
 */
describe("finity's own use of Solid", () => {
  it("is not reported in development", () => {
    const warn = spyOn(console, "warn");
    const error = spyOn(console, "error");

    let transition!: (to: { kind: "Ready"; resource: number }) => void;

    function View() {
      const count = finity.useState(1);
      const loose = finity.useTransitionalState(State, () => ({
        kind: "Loading",
      }));
      const strict = finity.useStrictlyTransitionalState(State, () => ({
        kind: "Loading",
      }));

      finity
        .useEffect(loose.value)
        .case(["Loading"], (s) => {
          s.transition({ kind: "Ready", resource: 1 });
        })
        .case(["Ready"], () => {})
        .use();

      transition = (to) => {
        const s = strict.value();
        if (s.kind === "Loading") s.transition(to);
      };

      return (
        <>
          <span>{count.value()}</span>
          {finity
            .useRender(strict.value)
            .case(["Loading"], (s) => <span>{s.kind}</span>)
            .case(["Ready"], (s) => (
              <span>
                {s.kind}:{s.resource}
              </span>
            ))
            .use()}
        </>
      );
    }

    const { container } = render(() => <View />);

    settle();
    transition({ kind: "Ready", resource: 2 });
    settle();

    expect(container.textContent).toBe("1Ready:2");
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    warn.mockRestore();
    error.mockRestore();
  });
});
