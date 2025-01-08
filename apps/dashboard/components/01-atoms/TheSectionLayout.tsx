"use client";

import React from "react";

export const TheSectionLayout = ({
  icon,
  title,
  description,
  switchDate,
  children,
}: {
  icon?: React.JSX.Element;
  title: string;
  description?: string;
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
      {description && (
        <p className="flex w-full flex-col text-start text-xs text-[#a1a1aa] sm:w-[75%] lg:w-[50%]">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};
