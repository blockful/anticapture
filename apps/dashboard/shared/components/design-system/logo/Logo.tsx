import { cn } from "@/shared/utils/cn";

export type LogoVariant = "brand" | "default" | "inverted" | "monochrome";

export type LogoSize = "sm" | "md" | "lg" | "xl";

export type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
};

const sizeMap: Record<LogoSize, number> = {
  sm: 24,
  md: 36,
  lg: 48,
  xl: 76,
};

const variantColorMap: Record<LogoVariant, string> = {
  brand: "var(--base-brand)",
  default: "currentColor",
  inverted: "var(--base-primary-foreground)",
  monochrome: "var(--base-muted-foreground)",
};

export const Logo = ({
  variant = "brand",
  size = "md",
  className,
}: LogoProps) => {
  const px = sizeMap[size];
  const color = variantColorMap[variant];

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Anticapture logo"
      role="img"
      className={cn(className)}
    >
      <path
        d="M25 30L20.9274 6H15.6969L13.0791 19.3897L11 30H15.4301L18.2794 15.0173L18.954 19.4662L19.2611 21.5567L20.5347 30H25Z"
        fill={color}
      />
      <path d="M11 2H2V11" stroke={color} strokeWidth="3.5" />
      <path d="M34 11L34 2L25 2" stroke={color} strokeWidth="3.5" />
      <path d="M25 34L34 34L34 25" stroke={color} strokeWidth="3.5" />
      <path d="M2 25L2 34L11 34" stroke={color} strokeWidth="3.5" />
    </svg>
  );
};
