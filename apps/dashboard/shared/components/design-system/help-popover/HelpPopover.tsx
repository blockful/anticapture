"use client";

import { useState } from "react";
import {
  CircleHelp,
  Calendar,
  BookOpen,
  HelpCircle,
  X,
  MessageCircle,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/utils";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { BadgeIcon } from "@/shared/components/design-system/badges/BadgeIcon";

interface HelpPopoverProps {
  className?: string;
}

type HelpLinkKey = "calendly" | "framework" | "faq";

interface HelpLink {
  key: HelpLinkKey;
  href: string;
  text: string;
  icon: LucideIcon;
  isExternal: boolean;
}

const HELP_LINKS: Record<HelpLinkKey, string> = {
  calendly: "https://calendly.com/zeugh-blockful/anticapture-walkthrough",
  framework: "https://blockful.gitbook.io/anticapture/anticapture/framework",
  faq: "/faq",
} as const;

const HELP_LINK_CONFIG: HelpLink[] = [
  {
    key: "calendly",
    href: HELP_LINKS.calendly,
    text: "Schedule a live walkthrough",
    icon: Calendar,
    isExternal: true,
  },
  {
    key: "framework",
    href: HELP_LINKS.framework,
    text: "Explore the Anticapture Framework",
    icon: BookOpen,
    isExternal: true,
  },
  {
    key: "faq",
    href: HELP_LINKS.faq,
    text: "Frequently Asked Questions",
    icon: HelpCircle,
    isExternal: false,
  },
];

const LinkButton = ({ link }: { link: HelpLink }) => {
  const Icon = link.icon;
  const linkProps = link.isExternal
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Button variant="outline" size="md" className="justify-start" asChild>
      <a href={link.href} {...linkProps}>
        <Icon className="size-3.5" />
        {link.text}
      </a>
    </Button>
  );
};

export const HelpPopover = ({ className }: HelpPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            aria-label="Help"
            variant="primary"
            className={cn({
              "shadow-(--shadow-focus-ring)": isOpen,
            })}
          >
            <CircleHelp className="size-4" />
            Help
          </Button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            align="end"
            side="top"
            sideOffset={4}
            className="bg-surface-contrast border-border-contrast relative z-50 flex w-80 flex-col gap-2 overflow-hidden border p-3 shadow-lg data-[state=closed]:animate-[popover-slide-out_0.15s_ease-in] data-[state=open]:animate-[popover-slide-in_0.2s_ease-out]"
          >
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <BadgeIcon
                icon={MessageCircle}
                iconVariant={"dimmed"}
                className="bg-surface-opacity size-10 items-center justify-center"
                iconClassName="size-4"
              />
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                aria-label="Close"
                className="absolute right-0 top-1.5"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="mb-2 flex flex-col gap-1">
              <p className="text-secondary font-mono text-xs font-medium">
                [DETECTED: HELP NEEDED]
              </p>
              <p className="text-primary text-md font-medium">
                Schedule a live walkthrough with our team, or explore our docs.
              </p>
            </div>

            {/* Links */}
            {HELP_LINK_CONFIG.map((link) => (
              <LinkButton key={link.key} link={link} />
            ))}
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    </div>
  );
};
