"use client";

import { cn } from "@/shared/utils";
import { cva, VariantProps } from "class-variance-authority";
import { DefaultLink } from "@/shared/components/design-system/links/default-link";
import { Github, Twitter } from "lucide-react";
import Link from "next/link";
import { TelegramIcon } from "@/shared/components/icons/TelegramIcon";

const footerVariant = cva(
  "w-full justify-center items-center px-4 py-3 opacity-60 hover:opacity-100 transition-opacity duration-300",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type TheFooterProps = VariantProps<typeof footerVariant> & {
  className?: string;
};

export const TheFooter = ({ variant, className }: TheFooterProps) => {
  return (
    <footer className={cn(footerVariant({ variant }), className)}>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-alternative-xs text-secondary flex font-mono uppercase">
            &gt;v1.1_
          </p>
          <p className="text-alternative-xs text-secondary flex font-mono uppercase">
            powered by
          </p>
          <DefaultLink
            href="https://blockful.io/"
            openInNewTab
            variant="default"
            className="text-alternative-xs text-secondary flex font-mono uppercase"
          >
            Blockful
          </DefaultLink>
        </div>
        <div className="flex gap-2 sm:hidden">
          {/* TODO: Commented for now, will be added back later */}
          {/* <DefaultLink
            href="https://anticapture.com/glossary"
            openInNewTab
            variant="default"
          >
            Docs
          </DefaultLink>
          <p className="text-alternative-xs text-secondary">/</p> */}
          <DefaultLink
            href="https://surveys.hotjar.com/346670a7-5423-4d65-8e93-30d0191a926a"
            openInNewTab
            variant="default"
            className="uppercase"
          >
            Give Feedback
          </DefaultLink>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex">
            <DefaultLink
              href="https://surveys.hotjar.com/346670a7-5423-4d65-8e93-30d0191a926a"
              openInNewTab
              variant="default"
              className="uppercase"
            >
              Give Feedback
            </DefaultLink>
          </div>
          <p className="text-dimmed hidden items-center uppercase sm:flex">/</p>
          <Link
            href="https://github.com/blockful/anticapture"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="text-secondary hover:text-primary size-4 transition-colors duration-300" />
          </Link>
          <Link
            href="https://x.com/anticapture"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twitter className="text-secondary hover:text-primary size-4 transition-colors duration-300" />
          </Link>
          <Link
            href="https://t.me/+uZlI0EZS2WM5YzMx"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TelegramIcon className="text-secondary hover:text-primary size-4 transition-colors duration-300" />
          </Link>
        </div>
      </div>
    </footer>
  );
};
