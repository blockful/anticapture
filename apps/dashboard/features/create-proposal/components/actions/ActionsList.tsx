"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useFormContext } from "react-hook-form";

import { ActionRow } from "@/features/create-proposal/components/actions/ActionRow";
import type { ProposalFormValues } from "@/features/create-proposal/schema";
import type { ProposalAction } from "@/features/create-proposal/types";

export type ActionField = ProposalFormValues["actions"][number] & {
  id: string;
};

interface ActionsListProps {
  fields: ActionField[];
  onMove: (from: number, to: number) => void;
  onEditAction: (index: number) => void;
  onDuplicateAction: (index: number) => void;
  onDeleteAction: (index: number) => void;
}

const firstErrorIn = (value: unknown, path = ""): string | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const message = (value as { message?: unknown }).message;
  if (typeof message === "string" && message) {
    return path ? `${path}: ${message}` : message;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = firstErrorIn(item, `${path}[${index}]`);
      if (found) return found;
    }
    return undefined;
  }

  for (const [key, item] of Object.entries(value)) {
    if (key === "ref" || key === "type" || key === "types") continue;
    const found = firstErrorIn(item, path ? `${path}.${key}` : key);
    if (found) return found;
  }
  return undefined;
};

export const ActionsList = ({
  fields,
  onMove,
  onEditAction,
  onDuplicateAction,
  onDeleteAction,
}: ActionsListProps) => {
  const {
    formState: { errors },
  } = useFormContext<ProposalFormValues>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.id === active.id);
    const to = fields.findIndex((f) => f.id === over.id);
    if (from >= 0 && to >= 0) onMove(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="border-border-default rounded-base flex flex-col overflow-hidden border [&>*+*]:border-t">
          {fields.map((field, index) => (
            <ActionRow
              key={field.id}
              id={field.id}
              index={index}
              action={field as ProposalAction}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
              onMoveUp={() => onMove(index, index - 1)}
              onMoveDown={() => onMove(index, index + 1)}
              onEdit={() => onEditAction(index)}
              onDuplicate={() => onDuplicateAction(index)}
              onDelete={() => onDeleteAction(index)}
              error={firstErrorIn(errors.actions?.[index])}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
