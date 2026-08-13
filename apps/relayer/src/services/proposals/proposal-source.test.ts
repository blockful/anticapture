import { describe, it, expect, vi } from "vitest";

import { AnticaptureProposalSource } from "./proposal-source";

const PROPOSAL_ID =
  "31309365093913580207991288430108338667724061355449265288906484597789511363394";

const FULL_PROPOSAL_RESPONSE = {
  id: PROPOSAL_ID,
  status: "SUCCEEDED",
  variant: "full",
  description: "# Fund the thing\nSend it.",
  targets: ["0x0000000000000000000000000000000000000001"],
  values: ["1000000000000000000"],
  calldatas: ["0xdeadbeef"],
};

function fakeFetch(status: number, body: unknown) {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe("AnticaptureProposalSource", () => {
  it("fetches a proposal by id and returns its execution args", async () => {
    const fetchFn = fakeFetch(200, FULL_PROPOSAL_RESPONSE);
    const source = new AnticaptureProposalSource("https://api.test", fetchFn);

    const proposal = await source.getProposal(PROPOSAL_ID);

    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.test/proposals/${PROPOSAL_ID}`,
    );
    expect(proposal).toEqual({
      targets: ["0x0000000000000000000000000000000000000001"],
      values: [1000000000000000000n],
      calldatas: ["0xdeadbeef"],
      description: "# Fund the thing\nSend it.",
    });
  });

  it("tolerates a trailing slash in the base URL", async () => {
    const fetchFn = fakeFetch(200, FULL_PROPOSAL_RESPONSE);
    const source = new AnticaptureProposalSource("https://api.test/", fetchFn);

    await source.getProposal(PROPOSAL_ID);

    expect(fetchFn).toHaveBeenCalledWith(
      `https://api.test/proposals/${PROPOSAL_ID}`,
    );
  });

  it("returns null when the API responds 404", async () => {
    const source = new AnticaptureProposalSource(
      "https://api.test",
      fakeFetch(404, { error: "Proposal not found" }),
    );

    expect(await source.getProposal(PROPOSAL_ID)).toBeNull();
  });

  it("throws on other non-OK responses", async () => {
    const source = new AnticaptureProposalSource(
      "https://api.test",
      fakeFetch(500, { error: "boom" }),
    );

    await expect(source.getProposal(PROPOSAL_ID)).rejects.toThrow(
      /proposal fetch failed/i,
    );
  });

  it("throws when the response is missing execution args (lean variant)", async () => {
    const source = new AnticaptureProposalSource(
      "https://api.test",
      fakeFetch(200, { id: PROPOSAL_ID, variant: "lean", status: "SUCCEEDED" }),
    );

    await expect(source.getProposal(PROPOSAL_ID)).rejects.toThrow(
      /execution args/i,
    );
  });
});
