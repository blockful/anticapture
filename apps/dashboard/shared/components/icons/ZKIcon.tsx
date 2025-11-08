import { DaoIconProps } from "@/shared/components/icons/types";

export const ZKIcon = ({ ...props }: DaoIconProps) => {
  return (
    <svg
      {...props}
      width="100%"
      height="100%"
      viewBox="0 0 27 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M26.3 7.40154L18.8635 0V5.41922L11.4805 10.8447L18.8635 10.851V14.8L26.3 7.40154Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 7.3984L7.43648 14.7969V9.4216L14.8194 3.9521L7.43648 3.94582V0L0 7.3984Z"
        fill="white"
      />
    </svg>
  );
};
