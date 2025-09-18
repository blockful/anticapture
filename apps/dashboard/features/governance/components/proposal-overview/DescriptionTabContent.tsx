import { GetProposalQuery } from "@anticapture/graphql-client";

interface DescriptionTabContentProps {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}

export const DescriptionTabContent = ({
  proposal,
}: DescriptionTabContentProps) => {
  return <div className="text-primary p-4">{proposal.description}</div>;
};
