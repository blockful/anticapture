import type { DaoIconProps } from "@/shared/components/icons/types";

export const ShutterIcon = ({
  showBackground = true,
  ...props
}: DaoIconProps) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 68 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {showBackground && <rect width="68" height="68" fill="#0044A4" />}
      <path
        d="M34 55L33.4785 54.7609C32.7862 54.4435 32.1082 54.1445 31.4491 53.8503C19.5527 48.5243 13 45.59 13 17.5808V16.5782L34 13L55 16.5782V17.5808C55 45.59 48.4473 48.5243 36.5509 53.8503C35.8918 54.1445 35.2185 54.4481 34.5215 54.7609L34 55ZM15.4608 18.5834C15.5936 44.1229 20.942 46.519 32.4779 51.684C32.9759 51.9047 33.4785 52.1347 33.9953 52.3646C34.5121 52.1301 35.0195 51.9047 35.5126 51.684C47.0485 46.519 52.3969 44.1229 52.5297 18.5834L33.9905 15.4238L15.4513 18.5834H15.4608Z"
        fill="white"
      />
      <mask
        id="shutter-icon-shield-mask"
        style={{ maskType: "alpha" }}
        maskUnits="userSpaceOnUse"
        x="13"
        y="14"
        width="40"
        height="40"
      >
        <path
          d="M14.355 35.3125L13 17.5938L34.0023 14.3125L52.9721 16.2812V28.0938L51.6171 36.625L47.5522 45.1562L32.6473 53.6875L18.42 45.1562L14.355 35.3125Z"
          fill="#D9D9D9"
        />
      </mask>
      <g mask="url(#shutter-icon-shield-mask)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M54.176 20.1971H11.645V14.209H54.176V20.1971Z"
          fill="white"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M54.176 26.8669H11.645V22.0745H54.176V26.8669Z"
          fill="white"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M54.176 33.024H11.645V28.9998H54.176V33.024Z"
          fill="white"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M54.176 39.394H11.645V36.262H54.176V39.394Z"
          fill="white"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M54.176 46.1405H11.645V43.7444H54.176V46.1405Z"
          fill="white"
        />
      </g>
    </svg>
  );
};
