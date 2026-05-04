import type { DaoIdEnum } from "@/shared/types/daos";

interface ProposalSeoTextInput {
  daoId: DaoIdEnum;
  isOffchain: boolean;
  title?: string | null;
  descriptionBody?: string | null;
}

export function buildProposalSeoText({
  daoId,
  isOffchain,
  title,
  descriptionBody,
}: ProposalSeoTextInput) {
  const fallbackTitle = `${daoId} DAO ${isOffchain ? "Offchain " : ""}Governance Proposal`;
  const proposalTitle = title?.trim() || fallbackTitle;
  const description =
    descriptionBody?.trim() ||
    (isOffchain
      ? `Analyze the governance security implications of "${proposalTitle}" in ${daoId} DAO, including delegate participation, offchain voting dynamics, and governance capture signals.`
      : `Analyze the governance security implications of "${proposalTitle}" in ${daoId} DAO, including vote distribution, delegate participation, and potential governance capture signals.`);

  return {
    proposalTitle,
    description,
    fullTitle: `${proposalTitle} | ${daoId} DAO Governance Security Analysis | Anticapture`,
  };
}
