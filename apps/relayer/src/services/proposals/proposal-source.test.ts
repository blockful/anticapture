import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";

import { AnticaptureProposalSource } from "./proposal-source";

const BASE_URL = "https://api.test";
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

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function respondWith(status: number, body: unknown) {
  server.use(
    http.get(`${BASE_URL}/proposals/${PROPOSAL_ID}`, () =>
      HttpResponse.json(body as Record<string, unknown>, { status }),
    ),
  );
}

describe("AnticaptureProposalSource", () => {
  it("fetches a proposal by id and returns its execution args", async () => {
    respondWith(200, FULL_PROPOSAL_RESPONSE);
    const source = new AnticaptureProposalSource(BASE_URL);

    const proposal = await source.getProposal(PROPOSAL_ID);

    expect(proposal).toEqual({
      targets: ["0x0000000000000000000000000000000000000001"],
      values: [1000000000000000000n],
      calldatas: ["0xdeadbeef"],
      description: "# Fund the thing\nSend it.",
    });
  });

  it("tolerates a trailing slash in the base URL", async () => {
    // onUnhandledRequest: "error" makes this strict — an unnormalized base
    // URL would produce /proposals// and fail the request.
    respondWith(200, FULL_PROPOSAL_RESPONSE);
    const source = new AnticaptureProposalSource(`${BASE_URL}/`);

    const proposal = await source.getProposal(PROPOSAL_ID);

    expect(proposal).not.toBeNull();
  });

  it("returns null when the API responds 404", async () => {
    respondWith(404, { error: "Proposal not found" });
    const source = new AnticaptureProposalSource(BASE_URL);

    expect(await source.getProposal(PROPOSAL_ID)).toBeNull();
  });

  it("throws on other non-OK responses", async () => {
    respondWith(500, { error: "boom" });
    const source = new AnticaptureProposalSource(BASE_URL);

    await expect(source.getProposal(PROPOSAL_ID)).rejects.toThrow(
      /proposal fetch failed/i,
    );
  });

  it("throws when the response is missing execution args (lean variant)", async () => {
    respondWith(200, {
      id: PROPOSAL_ID,
      variant: "lean",
      status: "SUCCEEDED",
    });
    const source = new AnticaptureProposalSource(BASE_URL);

    await expect(source.getProposal(PROPOSAL_ID)).rejects.toThrow(
      /execution args/i,
    );
  });
});
