"use client";

interface TextItemProps {
  label?: string;
  value?: string | number;
}

export const TextCardDaoInfoItem = ({
  item,
  className,
}: {
  item: TextItemProps;
  className?: string;
}) => {
  return (
    <p
      className={`flex h-full w-full rounded-lg bg-lightDark px-2 py-1 text-sm font-medium leading-tight text-[#FAFAFA] ${className}`}
    >
      {item.label} {item.value}
    </p>
  );
};
