"use client";

interface TextItemProps {
  label?: string;
  value?: string | number;
}

export const TextCardDaoInfoItem = (item: TextItemProps) => {
  return (
    <p className="flex h-full w-full text-sm font-medium leading-tight">
      {item.label} {item.value}
    </p>
  );
};
