"use client";

import { ReactNode } from "react";

interface BaseCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export const BaseCard = ({ title, icon, children }: BaseCardProps) => {
  return (
    <div className="card-container-about">
      <div className="card-header-about">
        {icon}
        <h1 className="card-header-about-text">{title}</h1>
      </div>
      <div className="card-body-about">{children}</div>
    </div>
  );
};
