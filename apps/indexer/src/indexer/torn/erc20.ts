import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address, getAddress } from "viem";

import { tokenTransfer, lockedVotingPowerChanged } from "@/eventHandlers";
import {
  updateDelegatedSupply,
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";
import {
  CONTRACT_ADDRESSES,
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
  NonCirculatingAddresses,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

export function TORNTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.TORN;
  const governorAddress = getAddress(
    CONTRACT_ADDRESSES[DaoIdEnum.TORN].governor.address,
  );
  // Post-v2, locked TORN is custodied in the TornadoVault, not the governor
  // (GovernanceVaultUpgrade._transferTokens). Both are lock "sinks": a Transfer
  // into either is a lock; out of either is an unlock. Pre-v2 used the governor.
  // https://etherscan.io/address/0x2F50508a8a3D323B91336FA3eA6Ae50e55f32185
  const vaultAddress = getAddress("0x2F50508a8a3D323B91336FA3eA6Ae50e55f32185");

  ponder.on("TORNToken:setup", async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on("TORNToken:Transfer", async ({ event, context }) => {
    const { from, to, value } = event.args;
    const { timestamp } = event.block;

    const cexAddressList = Object.values(CEXAddresses[daoId]);
    const dexAddressList = Object.values(DEXAddresses[daoId]);
    const lendingAddressList = Object.values(LendingAddresses[daoId]);
    const burningAddressList = Object.values(BurningAddresses[daoId]);
    const treasuryAddressList = Object.values(TreasuryAddresses[daoId]);
    const nonCirculatingAddressList = Object.values(
      NonCirculatingAddresses[daoId],
    );

    await tokenTransfer(
      context,
      daoId,
      {
        from,
        to,
        value,
        token: address,
        transactionHash: event.transaction.hash,
        timestamp: event.block.timestamp,
        logIndex: event.log.logIndex,
      },
      {
        cex: cexAddressList,
        dex: dexAddressList,
        lending: lendingAddressList,
        burning: burningAddressList,
      },
    );

    await updateSupplyMetric(
      context,
      "lendingSupply",
      lendingAddressList,
      MetricTypesEnum.LENDING_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "cexSupply",
      cexAddressList,
      MetricTypesEnum.CEX_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "dexSupply",
      dexAddressList,
      MetricTypesEnum.DEX_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "treasury",
      treasuryAddressList,
      MetricTypesEnum.TREASURY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateSupplyMetric(
      context,
      "nonCirculatingSupply",
      nonCirculatingAddressList,
      MetricTypesEnum.NON_CIRCULATING_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateTotalSupply(
      context,
      burningAddressList,
      MetricTypesEnum.TOTAL_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateCirculatingSupply(context, daoId, address, timestamp);

    // Track locks/unlocks: TORN moving in/out of governance custody (the
    // governor pre-v2, the TornadoVault post-v2). The non-custody side is the
    // user whose lockedBalance (voting power) changes. We update both the
    // aggregate delegatedSupply and the per-account voting power.
    const normalizedTo = getAddress(to);
    const normalizedFrom = getAddress(from);
    const toIsSink =
      normalizedTo === governorAddress || normalizedTo === vaultAddress;
    const fromIsSink =
      normalizedFrom === governorAddress || normalizedFrom === vaultAddress;

    // Lock: tokens move INTO custody from a user (ignore internal
    // governor<->vault moves such as the v2 migration).
    if (toIsSink && !fromIsSink) {
      await updateDelegatedSupply(context, daoId, address, value, timestamp);
      await lockedVotingPowerChanged(context, daoId, {
        account: from,
        delta: value,
        txHash: event.transaction.hash,
        timestamp,
        logIndex: event.log.logIndex,
      });
    }

    // Unlock: tokens move OUT of custody to a user.
    if (fromIsSink && !toIsSink) {
      await updateDelegatedSupply(context, daoId, address, -value, timestamp);
      await lockedVotingPowerChanged(context, daoId, {
        account: to,
        delta: -value,
        txHash: event.transaction.hash,
        timestamp,
        logIndex: event.log.logIndex,
      });
    }
  });
}
