import type * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasIcon?: boolean;
  error?: boolean;
};
