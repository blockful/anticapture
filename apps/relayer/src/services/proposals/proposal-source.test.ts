import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";

import { AnticaptureProposalSource } from "./proposal-source";

const BASE_URL = "https://gateful.test";
const DAO = "ens";
const API_KEY = "test-anticapture-api-key";
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
  const captured: { authorization: string | null } = { authorization: null };
  server.use(
    http.get(`${BASE_URL}/${DAO}/proposals/${PROPOSAL_ID}`, ({ request }) => {
      captured.authorization = request.headers.get("authorization");
      return HttpResponse.json(body as Record<string, unknown>, { status });
    }),
  );
  return captured;
}

function createSource(baseUrl = BASE_URL) {
  return new AnticaptureProposalSource(baseUrl, DAO, API_KEY);
}

describe("AnticaptureProposalSource", () => {
  it("fetches a proposal through the gateway and returns its execution args", async () => {
    const captured = respondWith(200, FULL_PROPOSAL_RESPONSE);

    const proposal = await createSource().getProposal(PROPOSAL_ID);

    expect(captured.authorization).toBe(`Bearer ${API_KEY}`);
    expect(proposal).toEqual({
      targets: ["0x0000000000000000000000000000000000000001"],
      values: [1000000000000000000n],
      calldatas: ["0xdeadbeef"],
      description: "# Fund the thing\nSend it.",
    });
  });

  it("rejects DAOs outside the API contract at construction", () => {
    expect(
      () => new AnticaptureProposalSource(BASE_URL, "NOT_A_DAO", API_KEY),
    ).toThrow(/not part of the Anticapture API contract/i);
  });

  it("lowercases the DAO id to match the gateway's typed contract", async () => {
    // onUnhandledRequest: "error" makes this strict — an ENS-uppercase path
    // would not match the handler and fail the request.
    respondWith(200, FULL_PROPOSAL_RESPONSE);
    const source = new AnticaptureProposalSource(BASE_URL, "ENS", API_KEY);

    expect(await source.getProposal(PROPOSAL_ID)).not.toBeNull();
  });

  it("tolerates a trailing slash in the base URL", async () => {
    respondWith(200, FULL_PROPOSAL_RESPONSE);

    const proposal = await createSource(`${BASE_URL}/`).getProposal(
      PROPOSAL_ID,
    );

    expect(proposal).not.toBeNull();
  });

  it("returns null when the gateway responds 404", async () => {
    respondWith(404, { error: "Proposal not found" });

    expect(await createSource().getProposal(PROPOSAL_ID)).toBeNull();
  });

  it("throws on other non-OK responses", async () => {
    respondWith(500, { error: "boom" });

    await expect(createSource().getProposal(PROPOSAL_ID)).rejects.toThrow(
      /proposal fetch failed .* with status 500/i,
    );
  });

  it("throws when the response is missing execution args (lean variant)", async () => {
    respondWith(200, {
      id: PROPOSAL_ID,
      variant: "lean",
      status: "SUCCEEDED",
    });

    await expect(createSource().getProposal(PROPOSAL_ID)).rejects.toThrow(
      /execution args/i,
    );
  });
});
