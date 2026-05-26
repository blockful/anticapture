"use client";

import { DollarSign, Pencil, PlusCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/design-system/buttons/button/Button";

interface ActionsPlaceholderCardProps {
  onAddTransfer: () => void;
  onAddCustom: () => void;
}

interface OptionTileProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
}

const OptionTile = ({ icon: Icon, title, onClick }: OptionTileProps) => (
  <Button
    variant="outline"
    onClick={onClick}
    className="flex-1 justify-start gap-3 p-3 text-left"
  >
    <span className="text-secondary mt-0.5 shrink-0">
      <Icon className="size-4" />
    </span>
    <span className="text-primary text-sm font-medium">{title}</span>
  </Button>
);

export const ActionsPlaceholderCard = ({
  onAddTransfer,
  onAddCustom,
}: ActionsPlaceholderCardProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="lg"
        onClick={() => setExpanded(true)}
        className="w-full justify-center gap-2"
      >
        <PlusCircle className="size-4" />
        Add action
      </Button>
    );
  }

  const handleSelect = (handler: () => void) => {
    setExpanded(false);
    handler();
  };

  return (
    <div className="border-border-default rounded-base flex flex-col gap-3 border border-dashed p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <OptionTile
          icon={DollarSign}
          title="Transfer"
          onClick={() => handleSelect(onAddTransfer)}
        />
        <OptionTile
          icon={Pencil}
          title="Custom Action"
          onClick={() => handleSelect(onAddCustom)}
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(false)}
        className="text-secondary hover:text-primary self-center"
      >
        Cancel
      </Button>
    </div>
  );
};
