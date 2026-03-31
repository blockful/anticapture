import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  Bell,
  Check,
  ChevronDown,
  Circle,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Flag,
  Globe,
  HelpCircle,
  Home,
  Info,
  Link,
  Lock,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Shield,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  User,
  Users,
  Vote,
  Wallet,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/utils/cn";

export type IconSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl";

const iconSizeClasses: Record<IconSize, string> = {
  xxs: "size-4", // 16px — --size-icon-xxs
  xs: "size-5", // 20px — --size-icon-xs
  sm: "size-6", // 24px — --size-icon-sm
  md: "size-9", // 36px — --size-icon-md
  lg: "size-12", // 48px — --size-icon-lg
  xl: "size-[76px]", // 76px — --size-icon-xl
};

const iconStrokeClasses: Record<IconSize, string> = {
  xxs: "stroke-[1.5]",
  xs: "stroke-[1.5]",
  sm: "stroke-[1.5]",
  md: "stroke-[1.5]",
  lg: "stroke-[1.25]",
  xl: "stroke-[1]",
};

export const ICON_SIZE_META: Record<
  IconSize,
  { px: number; token: string; description: string }
> = {
  xxs: {
    px: 16,
    token: "--size-icon-xxs",
    description: "Inline tiny icons, table cells",
  },
  xs: {
    px: 20,
    token: "--size-icon-xs",
    description: "Inline small icons, compact UI",
  },
  sm: {
    px: 24,
    token: "--size-icon-sm",
    description: "Default icon size, buttons, nav",
  },
  md: {
    px: 36,
    token: "--size-icon-md",
    description: "Medium emphasis, card headers",
  },
  lg: {
    px: 48,
    token: "--size-icon-lg",
    description: "Large display icons, empty states",
  },
  xl: {
    px: 76,
    token: "--size-icon-xl",
    description: "Hero / feature icons, landing",
  },
};

export const CATALOG_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Activity", icon: Activity },
  { name: "AlertCircle", icon: AlertCircle },
  { name: "AlertTriangle", icon: AlertTriangle },
  { name: "ArrowRight", icon: ArrowRight },
  { name: "BarChart2", icon: BarChart2 },
  { name: "Bell", icon: Bell },
  { name: "Check", icon: Check },
  { name: "ChevronDown", icon: ChevronDown },
  { name: "Circle", icon: Circle },
  { name: "Clock", icon: Clock },
  { name: "Copy", icon: Copy },
  { name: "ExternalLink", icon: ExternalLink },
  { name: "Eye", icon: Eye },
  { name: "Filter", icon: Filter },
  { name: "Flag", icon: Flag },
  { name: "Globe", icon: Globe },
  { name: "HelpCircle", icon: HelpCircle },
  { name: "Home", icon: Home },
  { name: "Info", icon: Info },
  { name: "Link", icon: Link },
  { name: "Lock", icon: Lock },
  { name: "LogOut", icon: LogOut },
  { name: "Menu", icon: Menu },
  { name: "MoreHorizontal", icon: MoreHorizontal },
  { name: "Plus", icon: Plus },
  { name: "Search", icon: Search },
  { name: "Settings", icon: Settings },
  { name: "Shield", icon: Shield },
  { name: "Star", icon: Star },
  { name: "ThumbsDown", icon: ThumbsDown },
  { name: "ThumbsUp", icon: ThumbsUp },
  { name: "Trash2", icon: Trash2 },
  { name: "TrendingUp", icon: TrendingUp },
  { name: "User", icon: User },
  { name: "Users", icon: Users },
  { name: "Vote", icon: Vote },
  { name: "Wallet", icon: Wallet },
  { name: "X", icon: X },
  { name: "XCircle", icon: XCircle },
  { name: "Zap", icon: Zap },
];

type IconSizeShowcaseProps = {
  icon?: LucideIcon;
  className?: string;
};

export const IconSizeShowcase = ({
  icon: Icon = Shield,
  className,
}: IconSizeShowcaseProps) => (
  <div className={cn("flex flex-col gap-8", className)}>
    {(
      Object.entries(ICON_SIZE_META) as [
        IconSize,
        (typeof ICON_SIZE_META)[IconSize],
      ][]
    ).map(([size, meta]) => (
      <div key={size} className="flex items-center gap-6">
        <div className="flex w-20 flex-col gap-0.5">
          <span className="text-primary font-mono text-xs font-medium">
            {size}
          </span>
          <span className="text-dimmed font-mono text-[10px]">{meta.px}px</span>
        </div>
        <Icon
          className={cn(
            "text-primary",
            iconSizeClasses[size],
            iconStrokeClasses[size],
          )}
        />
        <div className="flex flex-col gap-0.5">
          <code className="bg-surface-contrast text-secondary rounded px-1.5 py-0.5 font-mono text-[10px]">
            {meta.token}
          </code>
          <span className="text-dimmed text-xs">{meta.description}</span>
        </div>
      </div>
    ))}
  </div>
);

type IconGalleryProps = {
  size?: IconSize;
  className?: string;
};

export const IconGallery = ({ size = "sm", className }: IconGalleryProps) => (
  <div
    className={cn(
      "grid grid-cols-5 gap-4 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-12",
      className,
    )}
  >
    {CATALOG_ICONS.map(({ name, icon: Icon }) => (
      <div
        key={name}
        className="flex flex-col items-center gap-1.5"
        title={name}
      >
        <div className="bg-surface-contrast flex size-12 items-center justify-center rounded-md">
          <Icon
            className={cn(
              "text-primary",
              iconSizeClasses[size],
              iconStrokeClasses[size],
            )}
          />
        </div>
        <span className="text-dimmed max-w-[60px] truncate text-center font-mono text-[9px]">
          {name}
        </span>
      </div>
    ))}
  </div>
);
