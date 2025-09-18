import { GetProposalQuery } from "@anticapture/graphql-client";
import Markdown from "markdown-to-jsx";

interface DescriptionTabContentProps {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}

export const DescriptionTabContent = ({
  proposal,
}: DescriptionTabContentProps) => {
  return (
    <div className="text-primary p-4">
      <Markdown
        options={{
          overrides: {
            h1: {
              component: "p",
              props: {
                className: "text-primary ",
              },
            },
            h2: {
              component: "h2",
              props: {
                className: "text-primary mt-7 mb-4 text-[16px] leading-[24px]",
              },
            },
            h3: {
              component: "h3",
              props: {
                className: "text-primary mt-7 mb-4 text-[16px] leading-[24px]",
              },
            },
            p: {
              component: "p",
              props: {
                className: "text-secondary text-[14px] leading-[20px]",
              },
            },
          },
        }}
      >
        {proposal.description}
      </Markdown>

      {proposal.description}
    </div>
  );
};
