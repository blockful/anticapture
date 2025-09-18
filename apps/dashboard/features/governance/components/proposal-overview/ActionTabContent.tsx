import { GetProposalQuery } from "@anticapture/graphql-client";

export const ActionsTabContent = ({
  proposal,
}: {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}) => {
  console.log(proposal);

  return (
    <div className="text-primary p-4">Actions for proposal {proposal.id}</div>
  );
};
