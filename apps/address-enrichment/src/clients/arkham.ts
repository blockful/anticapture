import { z } from "zod";

/**
 * Arkham Intel API response schema for address intelligence
 * Based on https://docs.intel.arkm.com/
 */
const ArkhamAddressResponseSchema = z.object({
  address: z.string(),
  chain: z.string().optional(),
  arkhamEntity: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      type: z.string().optional(), // e.g., "cex", "dex", "defi", etc.
      note: z.string().optional(),
      service: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      twitter: z.string().nullable().optional(),
      crunchbase: z.string().nullable().optional(),
      linkedin: z.string().nullable().optional(),
    })
    .optional()
    .nullable(),
  arkhamLabel: z
    .object({
      name: z.string().optional(),
      address: z.string().optional(),
      chainType: z.string().optional(),
    })
    .optional()
    .nullable(),
  isUserAddress: z.boolean().optional(),
  contract: z.boolean().optional(),
});

export type ArkhamAddressResponse = z.infer<typeof ArkhamAddressResponseSchema>;

export interface ArkhamData {
  entity: string | null;
  entityType: string | null; // e.g., "cex", "dex", "defi"
  label: string | null;
  isContract: boolean | null; // null if Arkham doesn't know
}

export class ArkhamClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Fetches address intelligence from Arkham API
   * @param address - Ethereum address (0x...)
   * @returns Label information or null if API error
   */
  async getAddressIntelligence(address: string): Promise<ArkhamData | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/intelligence/address/${address}`,
        {
          method: "GET",
          headers: {
            "API-Key": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Address not found in Arkham's database
          return {
            entity: null,
            entityType: null,
            label: null,
            isContract: null,
          };
        }
        console.error(
          `Arkham API error: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data = await response.json();
      const parsed = ArkhamAddressResponseSchema.safeParse(data);

      if (!parsed.success) {
        console.error("Failed to parse Arkham response:", parsed.error);
        return null;
      }

      return {
        entity: parsed.data.arkhamEntity?.name ?? null,
        entityType: parsed.data.arkhamEntity?.type ?? null,
        label: parsed.data.arkhamLabel?.name ?? null,
        isContract: parsed.data.contract ?? null,
      };
    } catch (error) {
      console.error("Failed to fetch from Arkham API:", error);
      return null;
    }
  }
}
