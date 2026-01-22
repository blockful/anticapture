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
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { BadgeStatus } from "@/shared/components/design-system/badges/BadgeStatus";

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
    <a
      href={link.href}
      className="text-primary hover:text-highlight bg-surface-default border-border-contrast group flex items-center gap-1.5 border px-4 py-2.5 transition-colors"
      {...linkProps}
    >
      <Icon className="size-3.5" />
      <p className="text-sm font-medium transition-colors">{link.text}</p>
    </a>
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
        <PopoverContent
          align="end"
          side="top"
          sideOffset={8}
          className="bg-surface-contrast border-border-contrast relative flex w-80 flex-col gap-2 overflow-hidden border p-3"
        >
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <BadgeStatus
              icon={MessageCircle}
              iconVariant={"dimmed"}
              className="bg-surface-opacity size-10 items-center justify-center"
              iconClassName="size-4"
            />
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="absolute right-0 top-1.5"
              aria-label="Close"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-2 flex flex-col gap-1">
            <p className="text-secondary text-xs font-medium">
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
      </Popover>
    </div>
  );
};
