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
                className:
                  "text-primary break-words font-inter text-[24px] font-medium not-italic leading-[32px] tracking-[-0.144px]",
              },
            },
            h2: {
              component: "h2",
              props: {
                className:
                  "text-primary mt-7 mb-4 font-inter text-[20px] font-medium not-italic leading-[28px] tracking-[-0.1px] break-words",
              },
            },
            h3: {
              component: "h3",
              props: {
                className:
                  "text-primary mt-7 mb-4 font-inter text-[16px] font-medium not-italic leading-[24px] break-words",
              },
            },
            h4: {
              component: "h4",
              props: {
                className:
                  "text-primary mt-7 mb-4 font-inter text-[14px] font-medium not-italic leading-[20px] tracking-[-0.084px] break-words",
              },
            },
            h5: {
              component: "h5",
              props: {
                className:
                  "text-primary mt-7 mb-4 font-inter text-[12px] font-medium not-italic leading-[16px] tracking-[-0.072px] break-words",
              },
            },
            h6: {
              component: "h6",
              props: {
                className:
                  "text-primary mt-7 mb-4 font-inter text-[10px] font-medium not-italic leading-[14px] tracking-[-0.06px] break-words",
              },
            },
            p: {
              component: "p",
              props: {
                className:
                  "text-secondary text-[14px] leading-[20px] break-words",
              },
            },
            hr: {
              component: "hr",
              props: {
                className: "border-border-default mt-7",
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
                className: "break-all bg-surface-contrast px-1 rounded text-sm",
              },
            },
            ul: {
              component: "ul",
              props: {
                className: "list-disc list-inside space-y-2 mt-4 mb-4 pl-4",
              },
            },
            ol: {
              component: "ol",
              props: {
                className: "list-decimal list-inside space-y-2 mt-4 mb-4 pl-4",
              },
            },
            li: {
              component: "li",
              props: {
                className:
                  "text-secondary text-[14px] leading-[20px] break-words",
              },
            },
            strong: {
              component: "strong",
              props: {
                className:
                  "text-primary text-[14px] leading-[20px] break-words",
              },
            },
            table: {
              component: "table",
              props: {
                className: "w-full mt-4 mb-4",
              },
            },
            thead: {
              component: "thead",
              props: {
                className: "bg-surface-contrast overflow-hidden",
              },
            },
            tbody: {
              component: "tbody",
              props: {
                className: "border border-border-default overflow-hidden",
              },
            },
            tr: {
              component: "tr",
              props: {
                className: "hover:bg-muted/50",
              },
            },
            th: {
              component: "th",
              props: {
                className:
                  "text-left p-3  text-primary h-[32px]  px-2  text-[14px] font-semibold",
              },
            },
            td: {
              component: "td",
              props: {
                className:
                  "p-3 text-secondary text-[14px] leading-[20px] break-words",
              },
            },
            a: {
              component: "a",
              props: {
                className:
                  "text-link hover:text-link/80 font-mono text-[13px] font-medium leading-[20px] tracking-[0.78px] uppercase",
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          },
        }}
      >
        {proposal.description}
      </Markdown>
    </div>
  );
};
