"use client";

import React from "react";

export const TheSection = ({
  icon,
  title,
  switchDate,
  children,
}: {
  icon: React.JSX.Element;
  title: string;
  switchDate?: React.JSX.Element;
  children: React.ReactNode;
}) => {
  return (
    <div className="flex h-full w-full flex-col gap-5">
      <div className="flex h-full w-full flex-col justify-between gap-2 sm:flex-row sm:gap-0">
        <div className="flex items-center gap-3">
          {icon}
          <h1 className="text-left text-xl font-semibold text-white sm:text-3xl">
            {title}
          </h1>
        </div>
        <div className="flex">{switchDate}</div>
      </div>
      {children}
    </div>
  );
};
