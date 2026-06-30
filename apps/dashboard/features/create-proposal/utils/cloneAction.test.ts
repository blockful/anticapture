import { cloneAction } from "@/features/create-proposal/utils/cloneAction";
import type { CustomAction } from "@/features/create-proposal/types";

describe("cloneAction", () => {
  const sampleAction = (): CustomAction => ({
    type: "custom",
    contractAddress: "0x1111111111111111111111111111111111111111",
    abi: [
      {
        type: "function",
        name: "foo",
        inputs: [],
        outputs: [],
        stateMutability: "nonpayable",
      },
    ],
    functionName: "foo()",
    args: ["1", "[2, 3]"],
  });

  it("returns a structurally equal copy", () => {
    const action = sampleAction();
    expect(cloneAction(action)).toEqual(action);
  });

  it("produces an independent deep copy — mutating the copy never touches the source", () => {
    const action = sampleAction();

    const copy = cloneAction(action);
    copy.args[0] = "999";
    copy.args.push("extra");
    copy.contractAddress = "0x2222222222222222222222222222222222222222";

    expect(action.args).toEqual(["1", "[2, 3]"]);
    expect(action.contractAddress).toBe(
      "0x1111111111111111111111111111111111111111",
    );
  });
});
