import { SVGProps } from "react";

export const MainnetIcon = ({ ...props }: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12Z"
        fill="#627EEB"
      />
      <path
        d="M11.8633 14.6672V10.3581L7.6543 12.2018L11.8633 14.6672Z"
        fill="#FAFAFA"
      />
      <path
        d="M11.8633 10.0618V5.00209L7.78993 11.846L11.8633 10.0618Z"
        fill="#FAFAFA"
      />
      <path d="M12.1346 5V10.0618L16.2652 11.8713L12.1346 5Z" fill="#FAFAFA" />
      <path
        d="M12.1346 10.3581V14.6674L16.3466 12.203L12.1346 10.3581Z"
        fill="#FAFAFA"
      />
      <path d="M11.8633 19V15.534L7.6826 13.0863L11.8633 19Z" fill="#FAFAFA" />
      <path d="M12.1346 19L16.3153 13.0863L12.1346 15.534V19Z" fill="#FAFAFA" />
    </svg>
  );
};
