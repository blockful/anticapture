"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { AbiParameter } from "viem";

import { Button } from "@/shared/components/design-system/buttons/button/Button";
import { IconButton } from "@/shared/components/design-system/buttons/icon-button/IconButton";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import { Input } from "@/shared/components/design-system/form/fields/input/Input";
import { Select } from "@/shared/components/design-system/form/fields/select/Select";
import {
  buildEmpty,
  parseArrayType,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";
import {
  getAbiTypeCategory,
  getArgPlaceholder,
  validateSolidityArg,
} from "@/features/create-proposal/utils/validateArg";
import { Trash2 } from "lucide-react";

const getComponents = (param: AbiParameter): readonly AbiParameter[] =>
  (param as { components?: readonly AbiParameter[] }).components ?? [];

interface ArgInputProps {
  param: AbiParameter;
  value: ArgValue;
  onChange: (value: ArgValue) => void;
}

/** Single scalar control (bool/uint/int/address/bytes/string). Owns its own
 *  `touched` state so a validation error only appears after the user leaves the
 *  field — never while they're still typing. */
const LeafInput = ({
  type,
  value,
  onChange,
}: {
  type: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const [touched, setTouched] = useState(false);
  const category = getAbiTypeCategory(type);
  const error = touched ? validateSolidityArg(type, value) : null;

  if (category === "bool") {
    return (
      <Select
        items={[
          { label: "true", value: "true" },
          { label: "false", value: "false" },
        ]}
        value={value}
        onValueChange={onChange}
        placeholder="Select true or false…"
      />
    );
  }

  return (
    <>
      <Input
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (category === "uint") {
            if (!/^$|^\d+$|^0x[0-9a-fA-F]*$/.test(raw)) return;
          } else if (category === "int") {
            if (!/^$|^-?\d*$|^0x[0-9a-fA-F]*$/.test(raw)) return;
          }
          onChange(raw);
        }}
        onBlur={() => setTouched(true)}
        placeholder={getArgPlaceholder(type)}
        error={Boolean(error)}
        inputMode={
          category === "uint" || category === "int" ? "decimal" : "text"
        }
      />
      {error && <span className="text-error text-xs">{error}</span>}
    </>
  );
};

/** Repeatable / fixed list of element inputs. */
const ArrayInput = ({
  param,
  elementType,
  fixedLength,
  value,
  onChange,
}: {
  param: AbiParameter;
  elementType: string;
  fixedLength: number | null;
  value: ArgValue;
  onChange: (value: ArgValue) => void;
}) => {
  const child = { ...param, type: elementType } as AbiParameter;
  const raw = Array.isArray(value) ? value : [];
  const items =
    fixedLength !== null
      ? Array.from(
          { length: fixedLength },
          (_, i) => raw[i] ?? buildEmpty(child),
        )
      : raw;

  const updateAt = (index: number, next: ArgValue) =>
    onChange(items.map((item, i) => (i === index ? next : item)));
  const removeAt = (index: number) =>
    onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, buildEmpty(child)]);

  return (
    <div className="border-border-default flex flex-col gap-2 border-l pl-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-secondary pt-2 text-xs">{i + 1}.</span>
          <div className="min-w-0 flex-1">
            <ArgInput
              param={child}
              value={item}
              onChange={(next) => updateAt(i, next)}
            />
          </div>
          {fixedLength === null && (
            <IconButton
              icon={Trash2}
              variant="ghost"
              size="sm"
              aria-label={`Remove item ${i + 1}`}
              onClick={() => removeAt(i)}
            />
          )}
        </div>
      ))}
      {fixedLength === null && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={add} className="gap-1">
            <Plus className="size-4" />
            Add item
          </Button>
          {items.length === 0 && (
            <span className="text-secondary text-xs">
              Empty list — encodes to []
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/** Sub-form for a struct/tuple: one labelled ArgInput per component. */
const TupleInput = ({
  param,
  value,
  onChange,
}: {
  param: AbiParameter;
  value: ArgValue;
  onChange: (value: ArgValue) => void;
}) => {
  const components = getComponents(param);
  const items = Array.isArray(value) ? value : components.map(() => "");

  const updateAt = (index: number, next: ArgValue) =>
    onChange(components.map((_, i) => (i === index ? next : (items[i] ?? ""))));

  return (
    <div className="border-border-default flex flex-col gap-3 border-l pl-3">
      {components.map((component, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <FormLabel isRequired>
            {component.name || `field${i}`}{" "}
            <span className="text-secondary font-normal">
              ({component.type})
            </span>
          </FormLabel>
          <ArgInput
            param={component}
            value={items[i] ?? buildEmpty(component)}
            onChange={(next) => updateAt(i, next)}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Recursively renders an editable control for one ABI parameter, dispatching by
 * type: arrays → list, tuples → sub-form, everything else → scalar leaf. The
 * renderer calls itself for nested element/component types, so it handles
 * arbitrary nesting (array of structs, struct of arrays, multidimensional
 * arrays, …).
 */
export const ArgInput = ({ param, value, onChange }: ArgInputProps) => {
  const arr = parseArrayType(param.type);
  if (arr) {
    return (
      <ArrayInput
        param={param}
        elementType={arr.elementType}
        fixedLength={arr.length}
        value={value}
        onChange={onChange}
      />
    );
  }
  if (param.type === "tuple") {
    return <TupleInput param={param} value={value} onChange={onChange} />;
  }
  return (
    <LeafInput
      type={param.type}
      value={typeof value === "string" ? value : ""}
      onChange={onChange}
    />
  );
};
