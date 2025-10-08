import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address } from "viem";

import { DaoIdEnum } from "@/lib/enums";
import { tokenTransfer } from "@/eventHandlers";
import { handleTransaction } from "@/eventHandlers/shared";
import {
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
} from "@/lib/constants";
import {
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

export function ARBTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.ARB;

  ponder.on(`ARBToken:setup`, async ({ context }) => {
    await context.db.insert(token).values({
      id: address,
      name: daoId,
      decimals,
    });
  });

  ponder.on(`ARBToken:Transfer`, async ({ event, context }) => {
    const { from, to, value } = event.args;
    const { timestamp } = event.block;

    const tokenData = await context.db.find(token, {
      id: address,
    });

    if (!tokenData) {
      return;
    }

    const cexAddressList = Object.values(CEXAddresses[daoId]);
    const dexAddressList = Object.values(DEXAddresses[daoId]);
    const lendingAddressList = Object.values(LendingAddresses[daoId]);
    const burningAddressList = Object.values(BurningAddresses[daoId]);
    const treasuryAddressList = Object.values(TreasuryAddresses[daoId]);

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

    await updateTotalSupply(
      context,
      tokenData.totalSupply,
      burningAddressList,
      MetricTypesEnum.TOTAL_SUPPLY,
      from,
      to,
      value,
      daoId,
      address,
      timestamp,
    );

    await updateCirculatingSupply(
      context,
      tokenData,
      MetricTypesEnum.CIRCULATING_SUPPLY,
      daoId,
      address,
      timestamp,
    );

    if (!event.transaction.to) return;

    await handleTransaction(
      context,
      daoId,
      event.transaction.hash,
      event.transaction.from,
      event.transaction.to,
      event.block.timestamp,
      [event.args.from, event.args.to],
      {
        cex: cexAddressList,
        dex: dexAddressList,
        lending: lendingAddressList,
        burning: burningAddressList,
      },
    );
  });
}
