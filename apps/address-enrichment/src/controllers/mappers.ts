import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

const AddressSchema = z
  .string()
  .refine((addr) => isAddress(addr, { strict: false }))
  .transform((addr) => addr.toLowerCase());

export const AddressRequestSchema = z.object({
  address: AddressSchema.openapi({
    param: { name: "address", in: "path" },
    description: "Ethereum address (checksummed or lowercase)",
    example: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  }),
});

export const AddressResponseSchema = z.object({
  address: z
    .string()
    .transform((addr) => getAddress(addr))
    .openapi({
      description: "EIP-55 checksummed Ethereum address",
      example: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    }),
  isContract: z.boolean().openapi({
    description:
      "Whether the address is a smart contract (true) or an externally-owned account (false)",
    example: false,
  }),
  arkham: z
    .object({
      entity: z.string().nullable().openapi({
        description:
          "Human-readable name of the entity that owns the address according to Arkham Intelligence",
        example: "Vitalik Buterin",
      }),
      entityType: z.string().nullable().openapi({
        description:
          "Category of the entity (e.g. 'individual', 'exchange', 'protocol', 'fund')",
        example: "individual",
      }),
      label: z.string().nullable().openapi({
        description:
          "Fine-grained label for the specific address within the entity",
        example: "Vitalik Buterin: Personal Wallet",
      }),
      twitter: z.string().nullable().openapi({
        description: "Twitter/X handle associated with the entity, without '@'",
        example: "VitalikButerin",
      }),
    })
    .nullable()
    .openapi({
      description:
        "Arkham Intelligence label data. null when no data is available for the address.",
    }),
  ens: z
    .object({
      name: z.string().nullable().openapi({
        description: "Primary ENS name reverse-resolved for this address",
        example: "vitalik.eth",
      }),
      avatar: z.string().nullable().openapi({
        description: "URL of the ENS avatar image",
        example: "https://metadata.ens.domains/mainnet/avatar/vitalik.eth",
      }),
      banner: z.string().nullable().openapi({
        description: "URL of the ENS profile banner image",
        example: null,
      }),
    })
    .nullable()
    .openapi({
      description:
        "ENS (Ethereum Name Service) data. null when no ENS name is registered for the address. Cached with a configurable TTL.",
    }),
});

export const AddressesRequestSchema = z.object({
  addresses: z
    .array(AddressSchema)
    .min(1, "At least one address is required")
    .max(100, "Maximum 100 addresses per request")
    .openapi({
      description:
        "One or more Ethereum addresses to enrich. Can be passed as a repeated query parameter or a single value. Maximum 100 addresses per request.",
      example: [
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
      ],
    }),
});

export const AddressesResponseSchema = z.object({
  results: z.array(AddressResponseSchema).openapi({
    description:
      "Enrichment results for each successfully resolved address. Addresses that failed to resolve are omitted.",
  }),
});
