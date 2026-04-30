import ProposalPage from "./page";
import { permanentRedirect, redirect } from "next/navigation";

jest.mock("next/navigation", () => ({
  permanentRedirect: jest.fn(),
  redirect: jest.fn(),
}));

jest.mock(
  "@/features/governance/components/proposal-overview/ProposalSection",
  () => ({
    ProposalSection: () => null,
  }),
);

describe("ProposalPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("permanently redirects legacy offchain proposal URLs to the canonical route", async () => {
    await ProposalPage({
      params: Promise.resolve({
        daoId: "ens",
        proposalId: "snapshot proposal/id",
      }),
      searchParams: Promise.resolve({ proposalType: "offchain" }),
    });

    expect(permanentRedirect).toHaveBeenCalledWith(
      "/ens/governance/offchain-proposal/snapshot%20proposal%2Fid",
    );
    expect(redirect).not.toHaveBeenCalled();
  });
});
