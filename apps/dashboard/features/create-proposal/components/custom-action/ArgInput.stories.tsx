import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import type { AbiParameter } from "viem";

import { ArgInput } from "@/features/create-proposal/components/custom-action/ArgInput";
import { FormLabel } from "@/shared/components/design-system/form/fields/form-label/FormLabel";
import {
  argToStorage,
  buildEmpty,
  type ArgValue,
} from "@/features/create-proposal/utils/argTree";
import { isArgComplete } from "@/features/create-proposal/utils/validateArg";

const meta: Meta<typeof ArgInput> = {
  title: "Create Proposal/ArgInput",
  component: ArgInput,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof meta>;

// One representative param per supported Solidity type, including nested cases.
const TYPE_CASES: { label: string; param: AbiParameter }[] = [
  { label: "bool", param: { name: "flag", type: "bool" } },
  { label: "uint256", param: { name: "amount", type: "uint256" } },
  { label: "uint8", param: { name: "smallNum", type: "uint8" } },
  { label: "int256", param: { name: "delta", type: "int256" } },
  { label: "address", param: { name: "to", type: "address" } },
  { label: "bytes32", param: { name: "hash", type: "bytes32" } },
  { label: "bytes (dynamic)", param: { name: "data", type: "bytes" } },
  { label: "string", param: { name: "note", type: "string" } },
  {
    label: "uint256[] (dynamic array)",
    param: { name: "ids", type: "uint256[]" },
  },
  {
    label: "uint8[3] (fixed array)",
    param: { name: "trio", type: "uint8[3]" },
  },
  {
    label: "uint256[][] (multidimensional)",
    param: { name: "grid", type: "uint256[][]" },
  },
  {
    label: "tuple / struct",
    param: {
      name: "order",
      type: "tuple",
      components: [
        { name: "id", type: "uint256" },
        { name: "owner", type: "address" },
        { name: "active", type: "bool" },
      ],
    } as AbiParameter,
  },
  {
    label: "tuple[] (array of structs)",
    param: {
      name: "orders",
      type: "tuple[]",
      components: [
        { name: "id", type: "uint256" },
        { name: "amount", type: "uint256" },
      ],
    } as AbiParameter,
  },
  {
    label: "struct of arrays",
    param: {
      name: "bundle",
      type: "tuple",
      components: [
        { name: "ids", type: "uint256[]" },
        { name: "owner", type: "address" },
      ],
    } as AbiParameter,
  },
];

const TypeRow = ({ param }: { param: AbiParameter }) => {
  const [value, setValue] = useState<ArgValue>(() => buildEmpty(param));
  const complete = isArgComplete(param, value);
  return (
    <div className="border-border-default rounded-base flex flex-col gap-1.5 border p-3">
      <FormLabel>
        {param.name}{" "}
        <span className="text-secondary font-normal">({param.type})</span>
      </FormLabel>
      <ArgInput param={param} value={value} onChange={setValue} />
      <div className="text-secondary mt-1 flex flex-col gap-0.5 text-xs">
        <span>
          complete:{" "}
          <span className={complete ? "text-success" : "text-error"}>
            {String(complete)}
          </span>
        </span>
        <span className="break-all font-mono">
          stored: {argToStorage(param, value) || '""'}
        </span>
      </div>
    </div>
  );
};

/**
 * Exercises the recursive renderer against every supported Solidity type,
 * including nested arrays/tuples. Each row shows the live serialized storage
 * value and completeness — used to validate AC7–AC9 by eye.
 */
export const AllTypes: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      {TYPE_CASES.map(({ label, param }) => (
        <div key={label} className="flex flex-col gap-1">
          <span className="text-primary text-sm font-medium">{label}</span>
          <TypeRow param={param} />
        </div>
      ))}
    </div>
  ),
};
