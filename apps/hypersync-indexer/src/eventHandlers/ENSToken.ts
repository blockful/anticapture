import { ENSToken } from "../../generated/index.js";
import type { handlerContext } from "../../generated/index.js";
import type { Address, Hex } from "viem";
import { getAddress } from "viem";

import {
  CONTRACT_ADDRESSES,
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
  NonCirculatingAddresses,
} from "../lib/constants.ts";
import { DaoIdEnum } from "../lib/enums.ts";

import { delegateChanged, delegatedVotesChanged } from "./delegation.ts";
import { tokenTransfer } from "./transfer.ts";
import { createAddressSet, handleTransaction } from "./shared.ts";
import {
  updateDelegatedSupply,
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "./metrics/index.ts";

const DAO_ID = DaoIdEnum.ENS;
const ENS_CONTRACTS = CONTRACT_ADDRESSES[DAO_ID];
const TOKEN_ADDRESS = getAddress(ENS_CONTRACTS.token.address);
const TOKEN_DECIMALS = ENS_CONTRACTS.token.decimals;

const cexAddressSet = createAddressSet(Object.values(CEXAddresses[DAO_ID]));
const dexAddressSet = createAddressSet(Object.values(DEXAddresses[DAO_ID]));
const lendingAddressSet = createAddressSet(
  Object.values(LendingAddresses[DAO_ID]),
);
const burningAddressSet = createAddressSet(
  Object.values(BurningAddresses[DAO_ID]),
);
const treasuryAddressSet = createAddressSet(
  Object.values(TreasuryAddresses[DAO_ID]),
);
const nonCirculatingAddressSet = createAddressSet(
  Object.values(NonCirculatingAddresses[DAO_ID]),
);
const delegationAddressSets = {
  cex: cexAddressSet,
  dex: dexAddressSet,
  lending: lendingAddressSet,
  burning: burningAddressSet,
};

// Lazy token initialization — replaces Ponder's setup event
const ensureTokenExists = async (context: handlerContext) => {
  await context.Token.getOrCreate({
    id: TOKEN_ADDRESS,
    name: DAO_ID,
    decimals: TOKEN_DECIMALS,
    totalSupply: 0n,
    delegatedSupply: 0n,
    cexSupply: 0n,
    dexSupply: 0n,
    lendingSupply: 0n,
    circulatingSupply: 0n,
    treasury: 0n,
    nonCirculatingSupply: 0n,
  });
};

ENSToken.Transfer.handler(async ({ event, context }) => {
  const from = event.params.from as Address;
  const to = event.params.to as Address;
  const { value } = event.params;
  const timestamp = BigInt(event.block.timestamp);

  await ensureTokenExists(context);

  await tokenTransfer(
    context,
    DAO_ID,
    {
      from,
      to,
      value,
      token: TOKEN_ADDRESS,
      transactionHash: event.transaction.hash as Hex,
      timestamp,
      logIndex: event.logIndex,
    },
    {
      cex: cexAddressSet,
      dex: dexAddressSet,
      lending: lendingAddressSet,
      burning: burningAddressSet,
    },
  );

  await updateSupplyMetric(
    context,
    "lendingSupply",
    lendingAddressSet,
    MetricTypesEnum.LENDING_SUPPLY,
    from,
    to,
    value,
    DAO_ID,
    TOKEN_ADDRESS,
    timestamp,
  );
  await updateSupplyMetric(
    context,
    "cexSupply",
    cexAddressSet,
    MetricTypesEnum.CEX_SUPPLY,
    from,
    to,
    value,
    DAO_ID,
    TOKEN_ADDRESS,
    timestamp,
  );
  await updateSupplyMetric(
    context,
    "dexSupply",
    dexAddressSet,
    MetricTypesEnum.DEX_SUPPLY,
    from,
    to,
    value,
    DAO_ID,
    TOKEN_ADDRESS,
    timestamp,
  );
  await updateSupplyMetric(
    context,
    "treasury",
    treasuryAddressSet,
    MetricTypesEnum.TREASURY,
    from,
    to,
    value,
    DAO_ID,
    TOKEN_ADDRESS,
    timestamp,
  );
  await updateSupplyMetric(
    context,
    "nonCirculatingSupply",
    nonCirculatingAddressSet,
    MetricTypesEnum.NON_CIRCULATING_SUPPLY,
    from,
    to,
    value,
    DAO_ID,
    TOKEN_ADDRESS,
    timestamp,
  );
  await updateTotalSupply(
    context,
    burningAddressSet,
    MetricTypesEnum.TOTAL_SUPPLY,
    from,
    to,
    value,
    DAO_ID,
    TOKEN_ADDRESS,
    timestamp,
  );
  await updateCirculatingSupply(context, DAO_ID, TOKEN_ADDRESS, timestamp);

  if (!event.transaction.to) return;

  await handleTransaction(
    context,
    event.transaction.hash as Hex,
    from,
    event.transaction.to as Address,
    timestamp,
    [from, to],
    {
      cex: cexAddressSet,
      dex: dexAddressSet,
      lending: lendingAddressSet,
      burning: burningAddressSet,
    },
  );
});

ENSToken.DelegateChanged.handler(async ({ event, context }) => {
  const delegator = event.params.delegator as Address;
  const fromDelegate = event.params.fromDelegate as Address;
  const toDelegate = event.params.toDelegate as Address;
  const timestamp = BigInt(event.block.timestamp);

  await ensureTokenExists(context);

  await delegateChanged(
    context,
    DAO_ID,
    {
      delegator,
      delegate: toDelegate,
      tokenId: TOKEN_ADDRESS,
      previousDelegate: fromDelegate,
      txHash: event.transaction.hash as Hex,
      timestamp,
      logIndex: event.logIndex,
    },
    delegationAddressSets,
  );

  if (!event.transaction.to) return;

  await handleTransaction(
    context,
    event.transaction.hash as Hex,
    delegator,
    event.transaction.to as Address,
    timestamp,
    [delegator, toDelegate],
  );
});

ENSToken.DelegateVotesChanged.handler(async ({ event, context }) => {
  const delegate = event.params.delegate as Address;
  const { previousBalance, newBalance } = event.params;
  const timestamp = BigInt(event.block.timestamp);

  await ensureTokenExists(context);

  await delegatedVotesChanged(context, DAO_ID, {
    delegate,
    txHash: event.transaction.hash as Hex,
    newBalance,
    oldBalance: previousBalance,
    timestamp,
    logIndex: event.logIndex,
  });

  await updateDelegatedSupply(
    context,
    DAO_ID,
    TOKEN_ADDRESS,
    newBalance - previousBalance,
    timestamp,
  );

  if (!event.transaction.to) return;

  await handleTransaction(
    context,
    event.transaction.hash as Hex,
    delegate,
    event.transaction.to as Address,
    timestamp,
    [delegate],
  );
});
