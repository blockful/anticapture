import { GetProposalQuery } from "@anticapture/graphql-client";
import Markdown from "markdown-to-jsx";

interface DescriptionTabContentProps {
  proposal: NonNullable<GetProposalQuery["proposal"]>;
}

export const DescriptionTabContent = ({
  proposal,
}: DescriptionTabContentProps) => {
  return (
    <div className="text-primary overflow-hidden p-4">
      <Markdown
        className="overflow-wrap-anywhere break-words"
        options={{
          overrides: {
            h1: {
              component: "p",
              props: {
                className: "text-primary break-words",
              },
            },
            h2: {
              component: "h2",
              props: {
                className:
                  "text-primary mt-7 mb-4 text-[16px] leading-[24px] break-words",
              },
            },
            h3: {
              component: "h3",
              props: {
                className:
                  "text-primary mt-7 mb-4 text-[16px] leading-[24px] break-words",
              },
            },
            p: {
              component: "p",
              props: {
                className:
                  "text-secondary text-[14px] leading-[20px] break-words",
              },
            },
            pre: {
              component: "pre",
              props: {
                className:
                  "overflow-x-auto whitespace-pre-wrap break-words bg-muted p-2 rounded text-sm",
              },
            },
            code: {
              component: "code",
              props: {
                className: "break-all bg-muted px-1 rounded text-sm",
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
