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
import { cloneAction } from "@/features/create-proposal/utils/cloneAction";

interface ActionsListProps {
  onEditAction: (index: number) => void;
  onDeleteAction: (index: number) => void;
}

/**
 * The first thing wrong inside one action, as `field: message`.
 *
 * An action is a nested shape, so its errors arrive nested too, and nothing was
 * reading them: an invalid action left Publish disabled with no explanation
 * anywhere on the page. Reporting the first one is enough to act on, and beats
 * a row listing four complaints about a single paste.
 */
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
    // RHF hangs its own bookkeeping off the same object.
    if (key === "ref" || key === "type" || key === "types") continue;
    const found = firstErrorIn(item, path ? `${path}.${key}` : key);
    if (found) return found;
  }
  return undefined;
};

export const ActionsList = ({
  onEditAction,
  onDeleteAction,
}: ActionsListProps) => {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<ProposalFormValues>();
  const { fields, move, insert } = useFieldArray({ control, name: "actions" });

  // Insert an independent deep copy directly after the source row. `getValues`
  // returns the raw action (without RHF's internal field id) and `insert` mints
  // a fresh id for the copy.
  const handleDuplicate = (index: number) => {
    insert(index + 1, cloneAction(getValues(`actions.${index}`)));
  };

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
              onDuplicate={() => handleDuplicate(index)}
              onDelete={() => onDeleteAction(index)}
              error={firstErrorIn(errors.actions?.[index])}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
