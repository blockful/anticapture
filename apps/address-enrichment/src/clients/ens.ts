import { z } from "zod";

/**
 * ENS data response schema from ethfollow API
 * Based on https://api.ethfollow.xyz/api/v1/users/:addressOrENS/ens
 */
const EnsResponseSchema = z.object({
  ens: z.object({
    name: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    records: z
      .object({
        header: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  }),
});

export interface EnsData {
  name: string | null;
  avatar: string | null;
  banner: string | null;
}

export class ENSClient {
  private readonly baseUrl = "https://api.ethfollow.xyz";

  /**
   * Fetches ENS data for an address via ethfollow API
   * @param address - Ethereum address (0x...)
   * @returns ENS data or null if not found / API error
   */
  async getEnsData(address: string): Promise<EnsData | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/users/${address}/ens`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        console.error(
          `ENS API error: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data = await response.json();
      const parsed = EnsResponseSchema.safeParse(data);

      if (!parsed.success) {
        console.error("Failed to parse ENS response:", parsed.error);
        return null;
      }

      const { ens } = parsed.data;

      // If no name is returned, the address has no ENS
      if (!ens.name) {
        return null;
      }

      return {
        name: ens.name ?? null,
        avatar: ens.avatar ?? null,
        banner: ens.records?.header ?? null,
      };
    } catch (error) {
      console.error("Failed to fetch ENS data:", error);
      return null;
    }
  }
}
