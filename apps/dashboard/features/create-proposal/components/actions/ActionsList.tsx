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
import { useFieldArray, useFormContext } from "react-hook-form";

import { ActionRow } from "@/features/create-proposal/components/actions/ActionRow";
import type { ProposalFormValues } from "@/features/create-proposal/schema";

interface ActionsListProps {
  onEditAction: (index: number) => void;
  onDeleteAction: (index: number) => void;
}

export const ActionsList = ({
  onEditAction,
  onDeleteAction,
}: ActionsListProps) => {
  const { control } = useFormContext<ProposalFormValues>();
  const { fields, move } = useFieldArray({ control, name: "actions" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = fields.findIndex((f) => f.id === active.id);
    const to = fields.findIndex((f) => f.id === over.id);
    if (from >= 0 && to >= 0) move(from, to);
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
              action={field}
              isFirst={index === 0}
              isLast={index === fields.length - 1}
              onMoveUp={() => move(index, index - 1)}
              onMoveDown={() => move(index, index + 1)}
              onEdit={() => onEditAction(index)}
              onDelete={() => onDeleteAction(index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
