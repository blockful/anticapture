"use client";

import { StaticImageData } from "next/image";
import Image from "next/image";

interface TextItemProps {
  label?: string;
  value?: string;
  icon?: StaticImageData;
}

export const TextCardDaoInfoItem = ({
  item,
  className,
}: {
  item: TextItemProps;
  className?: string;
}) => {
  return (
    <div
      className={`flex h-full w-full px-2 py-1 text-sm font-medium leading-tight text-[#FAFAFA] sm:rounded-lg sm:bg-lightDark ${className}`}
    >
      {item.icon && (
        <p className="flex items-center">
          <Image alt="ok" src={item.icon} />
        </p>
      )}
      <p>
        {item.label} {item.value}
      </p>
    </div>
  );
};
