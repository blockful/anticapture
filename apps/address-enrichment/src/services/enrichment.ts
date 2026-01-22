import { eq } from "drizzle-orm";
import type { Address } from "viem";

import { getDb, schema } from "@/db";
import type { AddressEnrichment } from "@/db/schema";
import { ArkhamClient } from "@/clients/arkham";
import { isContract, createRpcClient } from "@/utils/address-type";

export interface EnrichmentResult {
  address: string;
  isContract: boolean;
  arkham: {
    entity: string | null;
    entityType: string | null;
    label: string | null;
  } | null;
  createdAt: string;
}

export class EnrichmentService {
  private arkhamClient: ArkhamClient;
  private rpcClient: ReturnType<typeof createRpcClient>;

  constructor(arkhamClient: ArkhamClient, rpcUrl: string) {
    this.arkhamClient = arkhamClient;
    this.rpcClient = createRpcClient(rpcUrl);
  }

  /**
   * Get enriched data for an address.
   * If data exists in DB, return it.
   * If not, fetch from Arkham API (and RPC if needed), store permanently, then return.
   */
  async getAddressEnrichment(address: string): Promise<EnrichmentResult> {
    const normalizedAddress = address.toLowerCase() as Address;
    const db = getDb();

    // Check if address exists in database
    const existing = await db.query.addressEnrichment.findFirst({
      where: eq(schema.addressEnrichment.address, normalizedAddress),
    });

    if (existing) {
      return this.mapToResult(existing);
    }

    // Fetch from Arkham first
    const arkhamData =
      await this.arkhamClient.getAddressIntelligence(normalizedAddress);

    // Use Arkham's contract info if available, otherwise fall back to RPC
    let isContractAddress: boolean;
    if (
      arkhamData?.isContract !== null &&
      arkhamData?.isContract !== undefined
    ) {
      isContractAddress = arkhamData.isContract;
    } else {
      isContractAddress = await isContract(this.rpcClient, normalizedAddress);
    }

    // Store permanently in database
    const newRecord: typeof schema.addressEnrichment.$inferInsert = {
      address: normalizedAddress,
      isContract: isContractAddress,
      arkhamEntity: arkhamData?.entity ?? null,
      arkhamEntityType: arkhamData?.entityType ?? null,
      arkhamLabel: arkhamData?.label ?? null,
    };

    const [inserted] = await db
      .insert(schema.addressEnrichment)
      .values(newRecord)
      .onConflictDoNothing()
      .returning();

    // If insert failed due to race condition, fetch existing
    if (!inserted) {
      const existingAfterRace = await db.query.addressEnrichment.findFirst({
        where: eq(schema.addressEnrichment.address, normalizedAddress),
      });
      if (existingAfterRace) {
        return this.mapToResult(existingAfterRace);
      }
      // This shouldn't happen, but return fetched data anyway
      return {
        address: normalizedAddress,
        isContract: isContractAddress,
        arkham: arkhamData
          ? {
              entity: arkhamData.entity,
              entityType: arkhamData.entityType,
              label: arkhamData.label,
            }
          : null,
        createdAt: new Date().toISOString(),
      };
    }

    return this.mapToResult(inserted);
  }

  private mapToResult(record: AddressEnrichment): EnrichmentResult {
    return {
      address: record.address,
      isContract: record.isContract,
      arkham: {
        entity: record.arkhamEntity,
        entityType: record.arkhamEntityType,
        label: record.arkhamLabel,
      },
      createdAt: record.createdAt.toISOString(),
    };
  }
}
