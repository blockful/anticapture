import { buildProposalSeoText } from "@/shared/seo/proposalMetadata";
import { DaoIdEnum } from "@/shared/types/daos";

describe("buildProposalSeoText", () => {
  test("uses proposal title and description when available", () => {
    const result = buildProposalSeoText({
      daoId: DaoIdEnum.ENS,
      isOffchain: false,
      title: "Upgrade resolver",
      descriptionBody: "Detailed proposal body",
    });

    expect(result).toEqual({
      proposalTitle: "Upgrade resolver",
      description: "Detailed proposal body",
      fullTitle:
        "Upgrade resolver | ENS DAO Governance Security Analysis | Anticapture",
    });
  });

  test("falls back without dereferencing a missing onchain proposal", () => {
    const result = buildProposalSeoText({
      daoId: DaoIdEnum.ENS,
      isOffchain: false,
      title: null,
      descriptionBody: null,
    });

    expect(result.proposalTitle).toBe("ENS DAO Governance Proposal");
    expect(result.description).toContain('"ENS DAO Governance Proposal"');
    expect(result.fullTitle).toBe(
      "ENS DAO Governance Proposal | ENS DAO Governance Security Analysis | Anticapture",
    );
  });

  test("uses the offchain fallback copy for missing offchain proposals", () => {
    const result = buildProposalSeoText({
      daoId: DaoIdEnum.UNISWAP,
      isOffchain: true,
      title: "",
      descriptionBody: "",
    });

    expect(result.proposalTitle).toBe("UNI DAO Offchain Governance Proposal");
    expect(result.description).toContain("offchain voting dynamics");
  });
});
