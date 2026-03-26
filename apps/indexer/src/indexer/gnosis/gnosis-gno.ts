import { ponder } from "ponder:registry";
import type { Context, Event } from "ponder:registry";
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
import { Address } from "viem";
import { tokenTransfer } from "@/eventHandlers";
import {
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

export function GnosisGnoTokenIndexer(address: Address) {
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

  const processTransfer = async (
    event: Event<`GnosisGNO:Transfer(address indexed from, address indexed to, uint256 value)`>,
    context: Context,
  ) => {
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
  };

  ponder.on(
    `GnosisGNO:Transfer(address indexed from, address indexed to, uint256 value)`,
    async ({ event, context }) => {
      await processTransfer(event, context);
    },
  );

  ponder.on(
    `GnosisGNO:Transfer(address indexed from, address indexed to, uint256 value, bytes data)`,
    async ({ event, context }) => {
      await processTransfer(event, context);
    },
  );
}
