import { schemaKeywords } from "@kubb/plugin-oas";
import type { Schema } from "@kubb/plugin-oas";
import { typeGenerator } from "@kubb/plugin-ts/generators";

type SchemaTransformerProps = {
  schema: { type?: unknown; format?: string } | null;
  name: string | null;
  parentName: string | null;
};

const zeroAddress = "0x0000000000000000000000000000000000000000";

const generatedFormatTypeByOpenApiFormat = {
  "ethereum-address": "Address",
  bigint: "BigInt",
} as const;

const addressFakerSchema: Schema = {
  keyword: schemaKeywords.const,
  args: {
    name: zeroAddress,
    value: zeroAddress,
    format: "string",
  },
};

const bigintFakerSchema: Schema = {
  keyword: schemaKeywords.bigint,
};

const createFormatTypeSchema = (name: string): Schema => ({
  keyword: schemaKeywords.ref,
  args: {
    name,
    $ref: "",
    path: "",
    isImportable: false,
  },
});

const getCustomStringFormat = ({ schema }: SchemaTransformerProps) =>
  schema?.type === "string" ? schema.format : undefined;

const replaceStringSchema = (schemas: Schema[], replacement: Schema) =>
  schemas.map((schema) =>
    schema.keyword === schemaKeywords.string ? replacement : schema,
  );

export const generatedFormatTypes = [
  "export type Address = `0x${string}`;",
  "export type BigInt = bigint;",
].join("\n");

export const mapEthereumFormatTypes = (
  schemaProps: SchemaTransformerProps,
  defaultSchemas: Schema[],
) => {
  const format = getCustomStringFormat(schemaProps);
  const formatType =
    format &&
    generatedFormatTypeByOpenApiFormat[
      format as keyof typeof generatedFormatTypeByOpenApiFormat
    ];

  if (!formatType) {
    return undefined;
  }

  return replaceStringSchema(
    defaultSchemas,
    createFormatTypeSchema(formatType),
  );
};

export const mapEthereumFormatFakers = (
  schemaProps: SchemaTransformerProps,
  defaultSchemas: Schema[],
) => {
  switch (getCustomStringFormat(schemaProps)) {
    case "ethereum-address":
      return replaceStringSchema(defaultSchemas, addressFakerSchema);
    case "bigint":
      return replaceStringSchema(defaultSchemas, bigintFakerSchema);
    default:
      return undefined;
  }
};

export const EthereumGenerator: typeof typeGenerator = {
  ...typeGenerator,
  name: "EthereumGenerator",
};
