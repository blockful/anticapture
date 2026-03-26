import { ponder } from "ponder:registry";
import {
  accountBalance,
  accountPower,
  token,
  votingPowerHistory,
} from "ponder:schema";
import { DaoIdEnum } from "@/lib/enums";
import {
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  MetricTypesEnum,
  NonCirculatingAddresses,
  TreasuryAddresses,
} from "@/lib/constants";
import { createAddressSet, handleTransaction } from "@/eventHandlers/shared";
import { Address, getAddress, zeroAddress } from "viem";
import { tokenTransfer } from "@/eventHandlers";
import {
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

export function MainnetGnoTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.GNO;
  const addressSets = {
    cex: createAddressSet(Object.values(CEXAddresses[daoId])),
    dex: createAddressSet(Object.values(DEXAddresses[daoId])),
    lending: createAddressSet(Object.values(LendingAddresses[daoId])),
    treasury: createAddressSet(Object.values(TreasuryAddresses[daoId])),
    nonCirculating: createAddressSet(
      Object.values(NonCirculatingAddresses[daoId]),
    ),
    burning: createAddressSet(Object.values(BurningAddresses[daoId])),
  };

  ponder.on(`MainnetGNO:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`MainnetGNO:Transfer`, async ({ event, context }) => {
    const { logIndex } = event.log;
    const { hash } = event.transaction;
    const { from, to, value } = event.args;
    const { timestamp } = event.block;

    // Process the transfer
    await tokenTransfer(
      context,
      daoId,
      {
        from: from,
        to: to,
        token: address,
        transactionHash: hash,
        value: value,
        timestamp: timestamp,
        logIndex: logIndex,
      },
      {
        cex: addressSets.cex,
        dex: addressSets.dex,
        burning: addressSets.burning,
      },
    );

    const lendingChanged = await updateSupplyMetric(
      context,
      "lendingSupply",
      addressSets.lending,
      MetricTypesEnum.LENDING_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    const cexChanged = await updateSupplyMetric(
      context,
      "cexSupply",
      addressSets.cex,
      MetricTypesEnum.CEX_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    const dexChanged = await updateSupplyMetric(
      context,
      "dexSupply",
      addressSets.dex,
      MetricTypesEnum.DEX_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    const treasuryChanged = await updateSupplyMetric(
      context,
      "treasury",
      addressSets.treasury,
      MetricTypesEnum.TREASURY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    const nonCirculatingChanged = await updateSupplyMetric(
      context,
      "nonCirculatingSupply",
      addressSets.nonCirculating,
      MetricTypesEnum.NON_CIRCULATING_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    const totalSupplyChanged = await updateTotalSupply(
      context,
      addressSets.burning,
      MetricTypesEnum.TOTAL_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    if (
      lendingChanged ||
      cexChanged ||
      dexChanged ||
      treasuryChanged ||
      nonCirculatingChanged ||
      totalSupplyChanged
    ) {
      await updateCirculatingSupply(context, daoId, address, timestamp);
    }

    // Sync voting power = balance for both addresses (GNO has no delegation)
    const [receiverBalance, senderBalance] = await Promise.all([
      context.db.find(accountBalance, {
        accountId: getAddress(to),
        tokenId: getAddress(address),
      }),
      from !== zeroAddress
        ? context.db.find(accountBalance, {
            accountId: getAddress(from),
            tokenId: getAddress(address),
          })
        : Promise.resolve(null),
    ]);

    const syncVotingPower = async (
      addr: Address,
      newBalance: bigint,
      vpLogIndex: number,
    ) => {
      await context.db
        .insert(votingPowerHistory)
        .values({
          daoId,
          transactionHash: hash,
          accountId: getAddress(addr),
          votingPower: newBalance,
          delta: newBalance,
          deltaMod: newBalance > 0n ? newBalance : -newBalance,
          timestamp,
          logIndex: vpLogIndex,
        })
        .onConflictDoNothing();

      await context.db
        .insert(accountPower)
        .values({
          accountId: getAddress(addr),
          daoId,
          votingPower: newBalance,
        })
        .onConflictDoUpdate(() => ({
          votingPower: newBalance,
        }));
    };

    await Promise.all([
      syncVotingPower(to, receiverBalance?.balance ?? 0n, logIndex),
      from !== zeroAddress
        ? syncVotingPower(from, senderBalance?.balance ?? 0n, logIndex + 1)
        : Promise.resolve(),
    ]);

    if (!to) return;

    // Handle transaction creation/update with flag calculation
    await handleTransaction(
      context,
      hash,
      from,
      to,
      timestamp,
      [from, to], // Addresses to check
      {
        cex: addressSets.cex,
        dex: addressSets.dex,
        lending: addressSets.lending,
        burning: addressSets.burning,
      },
    );
  });
}
