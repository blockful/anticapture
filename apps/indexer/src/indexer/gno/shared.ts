import { token } from "ponder:schema";
import { Context } from "ponder:registry";
import { Address } from "viem";

import { tokenTransfer } from "@/eventHandlers";
import {
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";
import { handleTransaction } from "@/eventHandlers/shared";
import {
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

export async function gnoSetup(
  context: Context,
  address: Address,
  daoId: DaoIdEnum,
  decimals: number,
) {
  await context.db.insert(token).values({
    id: address,
    name: daoId,
    decimals,
  });
}

export async function gnoTransfer(
  context: Context,
  daoId: DaoIdEnum,
  {
    from,
    to,
    value,
    token: tokenAddress,
    transactionHash,
    timestamp,
    logIndex,
    transactionFrom,
    transactionTo,
  }: {
    from: Address;
    to: Address;
    value: bigint;
    token: Address;
    transactionHash: `0x${string}`;
    timestamp: bigint;
    logIndex: number;
    transactionFrom: Address;
    transactionTo: Address | null;
  },
) {
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
      token: tokenAddress,
      transactionHash,
      timestamp,
      logIndex,
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
    tokenAddress,
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
    tokenAddress,
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
    tokenAddress,
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
    tokenAddress,
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
    tokenAddress,
    timestamp,
  );
  await updateCirculatingSupply(context, daoId, tokenAddress, timestamp);

  if (!transactionTo) return;

  await handleTransaction(
    context,
    transactionHash,
    transactionFrom,
    transactionTo,
    timestamp,
    [from, to],
    {
      cex: cexAddressList,
      dex: dexAddressList,
      lending: lendingAddressList,
      burning: burningAddressList,
    },
  );
}
