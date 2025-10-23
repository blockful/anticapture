import { DaoIconProps } from "@/shared/components/icons/types";

export const NounsIcon = ({
  showBackground = true,
  ...props
}: DaoIconProps) => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {showBackground && <rect width="40" height="40" fill="#E9C80A" />}
      <path d="M12 16.0127H16V24.063H12V16.0127Z" fill="white" />
      <path d="M16 16.0127H20V24.063H16V16.0127Z" fill="black" />
      <path d="M26 16.0127H30V24.063H26V16.0127Z" fill="white" />
      <path d="M30 16.0127H34V24.063H30V16.0127Z" fill="black" />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M36 26.0755H24V20.0377H22V26.0755H10V20.0377H6V24.0629H4V18.0252H10V14H22V18.0252H24V14H36V26.0755ZM34 24.0629V16.0126H26V24.0629H34ZM12 24.0629H20V16.0126H12V24.0629Z"
        fill="#F3322C"
      />
    </svg>
  );
};
