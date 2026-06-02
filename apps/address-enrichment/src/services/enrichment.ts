import { eq } from "drizzle-orm";
import { getAddress } from "viem";
import z from "zod";

import { ArkhamClient } from "@/clients/arkham";
import { ENSClient } from "@/clients/ens";
import type { EfpClient } from "@/clients/efp";
import { getDb, addressEnrichment } from "@/db";
import type { AddressEnrichment } from "@/db/schema";
import { logger } from "@/logger";
import { isContract, createRpcClient } from "@/utils/address-type";

export const EnrichmentResultSchema = z.object({
  address: z.string(),
  isContract: z.boolean(),
  arkham: z
    .object({
      entity: z.string().nullable(),
      entityType: z.string().nullable(),
      label: z.string().nullable(),
      twitter: z.string().nullable(),
    })
    .nullable(),
  ens: z
    .object({
      name: z.string().nullable(),
      avatar: z.string().nullable(),
      banner: z.string().nullable(),
    })
    .nullable(),
  efp: z
    .object({
      followersCount: z.number(),
      followingCount: z.number(),
    })
    .nullable(),
  createdAt: z.string(),
});

export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;

export class EnrichmentService {
  private arkhamClient: ArkhamClient;
  private ensClient: ENSClient;
  private efpClient: EfpClient;
  private rpcClient: ReturnType<typeof createRpcClient>;
  private ensCacheTtlMinutes: number;
  private efpCacheTtlMinutes: number;

  constructor(
    arkhamClient: ArkhamClient,
    ensClient: ENSClient,
    efpClient: EfpClient,
    rpcUrl: string,
    ensCacheTtlMinutes: number,
    efpCacheTtlMinutes: number,
  ) {
    this.arkhamClient = arkhamClient;
    this.ensClient = ensClient;
    this.efpClient = efpClient;
    this.rpcClient = createRpcClient(rpcUrl);
    this.ensCacheTtlMinutes = ensCacheTtlMinutes;
    this.efpCacheTtlMinutes = efpCacheTtlMinutes;
  }

  /**
   * Get enriched data for an address.
   * - Arkham data is permanent (fetched once, stored forever).
   * - ENS and EFP data are cached with configurable TTLs and refetched when stale.
   */
  async getAddressEnrichment(address: string): Promise<EnrichmentResult> {
    const normalizedAddress =
      address.toLowerCase(); /* FIXME: Unfortunately the addresses have already been commited to
     * the database in lowercase format, checksum format could only be
     * used here if we were to convert all current records */
    const db = getDb();

    const existing = await db.query.addressEnrichment.findFirst({
      where: eq(addressEnrichment.address, normalizedAddress),
    });

    if (existing) {
      const needsEnsRefresh = !this.isEnsFresh(existing);
      const needsEfpRefresh = !this.isEfpFresh(existing);

      if (!needsEnsRefresh && !needsEfpRefresh) {
        return this.mapToResult(existing);
      }

      logger.info(
        {
          address: normalizedAddress,
          needsEnsRefresh,
          needsEfpRefresh,
        },
        "refreshing stale enrichment cache",
      );

      const [ensData, efpData] = await Promise.all([
        needsEnsRefresh
          ? this.ensClient.getEnsData(normalizedAddress)
          : Promise.resolve(undefined),
        needsEfpRefresh
          ? this.efpClient.getUserStats(normalizedAddress)
          : Promise.resolve(undefined),
      ]);

      const now = new Date();
      const updates: Partial<typeof addressEnrichment.$inferInsert> = {};

      if (needsEnsRefresh) {
        updates.ensName = ensData?.name ?? null;
        updates.ensAvatar = ensData?.avatar ?? null;
        updates.ensBanner = ensData?.banner ?? null;
        updates.ensUpdatedAt = now;
      }

      if (needsEfpRefresh) {
        if (efpData) {
          updates.efpFollowersCount = efpData.followersCount;
          updates.efpFollowingCount = efpData.followingCount;
          updates.efpUpdatedAt = now;
        } else {
          updates.efpFollowersCount = null;
          updates.efpFollowingCount = null;
          updates.efpUpdatedAt = null;
        }
      }

      await db
        .update(addressEnrichment)
        .set(updates)
        .where(eq(addressEnrichment.address, normalizedAddress));

      return this.mapToResult({
        ...existing,
        ...updates,
      });
    }

    const [arkhamData, ensData, efpData] = await Promise.all([
      this.arkhamClient.getAddressIntelligence(normalizedAddress),
      this.ensClient.getEnsData(normalizedAddress),
      this.efpClient.getUserStats(normalizedAddress),
    ]);

    let isContractAddress: boolean;
    if (
      arkhamData?.isContract !== null &&
      arkhamData?.isContract !== undefined
    ) {
      isContractAddress = arkhamData.isContract;
    } else {
      isContractAddress = await isContract(
        this.rpcClient,
        getAddress(normalizedAddress),
      );
    }

    const now = new Date();

    const newRecord: typeof addressEnrichment.$inferInsert = {
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
      efpFollowersCount: efpData?.followersCount ?? null,
      efpFollowingCount: efpData?.followingCount ?? null,
      efpUpdatedAt: efpData ? now : null,
    };

    const [inserted] = await db
      .insert(addressEnrichment)
      .values(newRecord)
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      logger.warn(
        { address: normalizedAddress },
        "address enrichment insert failed - likely race condition",
      );
      const existingAfterRace = await db.query.addressEnrichment.findFirst({
        where: eq(addressEnrichment.address, normalizedAddress),
      });
      if (existingAfterRace) {
        return this.mapToResult(existingAfterRace);
      }
      logger.error(
        { address: normalizedAddress },
        "race condition fallback failed - record still not found",
      );
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
        efp: efpData,
        createdAt: new Date().toISOString(),
      };
    }

    return this.mapToResult(inserted);
  }

  private isEnsFresh(record: AddressEnrichment): boolean {
    if (!record.ensUpdatedAt) {
      return false;
    }

    const ttlMs = this.ensCacheTtlMinutes * 60 * 1000;
    const age = Date.now() - record.ensUpdatedAt.getTime();
    return age < ttlMs;
  }

  private isEfpFresh(record: AddressEnrichment): boolean {
    if (!record.efpUpdatedAt) {
      return false;
    }

    const ttlMs = this.efpCacheTtlMinutes * 60 * 1000;
    const age = Date.now() - record.efpUpdatedAt.getTime();
    return age < ttlMs;
  }

  private mapToResult(record: AddressEnrichment): EnrichmentResult {
    const hasEnsData = record.ensName !== null;
    const hasEfpData = record.efpUpdatedAt !== null;

    return EnrichmentResultSchema.parse({
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
      efp: hasEfpData
        ? {
            followersCount: record.efpFollowersCount ?? 0,
            followingCount: record.efpFollowingCount ?? 0,
          }
        : null,
      createdAt: record.createdAt.toISOString(),
    });
  }
}
