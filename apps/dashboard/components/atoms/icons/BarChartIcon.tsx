import { SVGProps } from "react";

export enum BarChatIconVariant {
  DEFAULT = "Default",
  SECONDARY = "Seconday",
}

interface BarChartIconProps extends SVGProps<SVGSVGElement> {
  variant?: BarChatIconVariant;
}

export const BarChartIcon = ({
  variant = BarChatIconVariant.DEFAULT,
  ...props
}: BarChartIconProps) => {
  const BarChartIcon: Partial<Record<BarChatIconVariant, React.ReactElement>> =
    {
      [BarChatIconVariant.DEFAULT]: (
        <svg
          {...props}
          width="16"
          height="17"
          viewBox="0 0 16 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="bar-chart-3">
            <path
              id="Vector"
              d="M2 2.5V14.5H14"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              id="Vector_2"
              d="M12 11.8333V6.5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              id="Vector_3"
              d="M8.66669 11.8335V3.8335"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              id="Vector_4"
              d="M5.33331 11.8335V9.8335"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      ),
      [BarChatIconVariant.SECONDARY]: (
        <svg
          {...props}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g id="bar-chart">
            <path
              id="Vector"
              d="M8 13.3337V6.66699"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              id="Vector_2"
              d="M12 13.3337V2.66699"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              id="Vector_3"
              d="M4 13.3337V10.667"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      ),
    };

  return BarChartIcon[variant] || <></>;
};
