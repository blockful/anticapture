import { SVGProps } from "react";

export const UserIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      {...props}
    >
      <path
        d="M22.1667 24.5V22.1667C22.1667 20.929 21.675 19.742 20.7999 18.8668C19.9247 17.9917 18.7377 17.5 17.5 17.5H10.5C9.26236 17.5 8.07538 17.9917 7.20021 18.8668C6.32504 19.742 5.83337 20.929 5.83337 22.1667V24.5"
        stroke="#FAFAFA"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 12.8333C16.5774 12.8333 18.6667 10.744 18.6667 8.16667C18.6667 5.58934 16.5774 3.5 14 3.5C11.4227 3.5 9.33337 5.58934 9.33337 8.16667C9.33337 10.744 11.4227 12.8333 14 12.8333Z"
        stroke="#FAFAFA"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
