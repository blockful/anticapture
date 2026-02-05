import { eq } from "drizzle-orm";
import type { Address } from "viem";

import { getDb, schema } from "@/db";
import type { AddressEnrichment } from "@/db/schema";
import { ArkhamClient } from "@/clients/arkham";
import { ENSClient } from "@/clients/ens";
import { isContract, createRpcClient } from "@/utils/address-type";

export interface EnrichmentResult {
  address: string;
  isContract: boolean;
  arkham: {
    entity: string | null;
    entityType: string | null;
    label: string | null;
    twitter: string | null;
  } | null;
  ens: {
    name: string | null;
    avatar: string | null;
    banner: string | null;
  } | null;
  createdAt: string;
}

export class EnrichmentService {
  private arkhamClient: ArkhamClient;
  private ensClient: ENSClient;
  private rpcClient: ReturnType<typeof createRpcClient>;
  private ensCacheTtlMinutes: number;

  constructor(
    arkhamClient: ArkhamClient,
    ensClient: ENSClient,
    rpcUrl: string,
    ensCacheTtlMinutes: number,
  ) {
    this.arkhamClient = arkhamClient;
    this.ensClient = ensClient;
    this.rpcClient = createRpcClient(rpcUrl);
    this.ensCacheTtlMinutes = ensCacheTtlMinutes;
  }

  /**
   * Get enriched data for an address.
   * - Arkham data is permanent (fetched once, stored forever).
   * - ENS data is cached with a configurable TTL and refetched when stale.
   */
  async getAddressEnrichment(address: string): Promise<EnrichmentResult> {
    const normalizedAddress = address.toLowerCase() as Address;
    const db = getDb();

    // Check if address exists in database
    const existing = await db.query.addressEnrichment.findFirst({
      where: eq(schema.addressEnrichment.address, normalizedAddress),
    });

    if (existing) {
      // Arkham data is permanent, but ENS may need refreshing
      if (this.isEnsFresh(existing)) {
        return this.mapToResult(existing);
      }

      // ENS data is stale or missing — refetch
      const ensData = await this.ensClient.getEnsData(normalizedAddress);
      const now = new Date();

      await db
        .update(schema.addressEnrichment)
        .set({
          ensName: ensData?.name ?? null,
          ensAvatar: ensData?.avatar ?? null,
          ensBanner: ensData?.banner ?? null,
          ensUpdatedAt: now,
        })
        .where(eq(schema.addressEnrichment.address, normalizedAddress));

      return this.mapToResult({
        ...existing,
        ensName: ensData?.name ?? null,
        ensAvatar: ensData?.avatar ?? null,
        ensBanner: ensData?.banner ?? null,
        ensUpdatedAt: now,
      });
    }

    // Address not in DB — fetch Arkham + ENS in parallel
    const [arkhamData, ensData] = await Promise.all([
      this.arkhamClient.getAddressIntelligence(normalizedAddress),
      this.ensClient.getEnsData(normalizedAddress),
    ]);

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

    const now = new Date();

    // Store in database
    const newRecord: typeof schema.addressEnrichment.$inferInsert = {
      address: normalizedAddress,
      isContract: isContractAddress,
      arkhamEntity: arkhamData?.entity ?? null,
      arkhamEntityType: arkhamData?.entityType ?? null,
      arkhamLabel: arkhamData?.label ?? null,
      arkhamTwitter: arkhamData?.twitter ?? null,
      ensName: ensData?.name ?? null,
      ensAvatar: ensData?.avatar ?? null,
      ensBanner: ensData?.banner ?? null,
      ensUpdatedAt: now,
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
              twitter: arkhamData.twitter,
            }
          : null,
        ens: ensData,
        createdAt: new Date().toISOString(),
      };
    }

    return this.mapToResult(inserted);
  }

  /**
   * Check if ENS data is still fresh based on the configured TTL.
   */
  private isEnsFresh(record: AddressEnrichment): boolean {
    if (!record.ensUpdatedAt) {
      return false;
    }

    const ttlMs = this.ensCacheTtlMinutes * 60 * 1000;
    const age = Date.now() - record.ensUpdatedAt.getTime();
    return age < ttlMs;
  }

  private mapToResult(record: AddressEnrichment): EnrichmentResult {
    const hasEnsData = record.ensName !== null;

    return {
      address: record.address,
      isContract: record.isContract,
      arkham: {
        entity: record.arkhamEntity,
        entityType: record.arkhamEntityType,
        label: record.arkhamLabel,
        twitter: record.arkhamTwitter,
      },
      ens: hasEnsData
        ? {
            name: record.ensName,
            avatar: record.ensAvatar,
            banner: record.ensBanner,
          }
        : null,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
