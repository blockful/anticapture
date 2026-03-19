import type * as React from "react";

export type FormLabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  children: React.ReactNode;
  isRequired?: boolean;
  isOptional?: boolean;
};
