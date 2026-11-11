import { describe, expect, it } from "vitest";

import { applyProposalContentUpdate } from "./proposal-content";

const current = {
  title: "Original",
  description: "# Original\n\nbody",
  targets: ["0x0000000000000000000000000000000000000001"],
  values: [0n],
  signatures: ["old()"],
  calldatas: ["0x01"],
};

describe("applyProposalContentUpdate", () => {
  it("replaces the description and retitles from the new H1", () => {
    const next = applyProposalContentUpdate(current, {
      description: "# Noun 911\n\nupdated",
    });

    expect(next.title).toBe("Noun 911");
    expect(next.description).toBe("# Noun 911\n\nupdated");
    expect(next.targets).toEqual(current.targets);
    expect(next.calldatas).toEqual(current.calldatas);
  });

  it("replaces transactions without touching the description", () => {
    const next = applyProposalContentUpdate(current, {
      targets: ["0x0000000000000000000000000000000000000002"],
      values: [1n],
      signatures: ["next()"],
      calldatas: ["0x02"],
    });

    expect(next.description).toBe(current.description);
    expect(next.title).toBe(current.title);
    expect(next.targets).toEqual([
      "0x0000000000000000000000000000000000000002",
    ]);
    expect(next.values).toEqual([1n]);
    expect(next.signatures).toEqual(["next()"]);
    expect(next.calldatas).toEqual(["0x02"]);
  });
});
