import { ponder } from "ponder:registry";
import { token } from "ponder:schema";
import { Address, getAddress } from "viem";

import { tokenTransfer } from "@/eventHandlers";
import {
  updateDelegatedSupply,
  updateCirculatingSupply,
  updateSupplyMetric,
  updateTotalSupply,
} from "@/eventHandlers/metrics";

import { addLockedBalance, applyVotingPower, getDelegate } from "./shared";
import {
  MetricTypesEnum,
  BurningAddresses,
  CEXAddresses,
  CONTRACT_ADDRESSES,
  DEXAddresses,
  LendingAddresses,
  TreasuryAddresses,
  NonCirculatingAddresses,
} from "@/lib/constants";
import { DaoIdEnum } from "@/lib/enums";

export function TORNTokenIndexer(address: Address, decimals: number) {
  const daoId = DaoIdEnum.TORN;

  // Contracts that custody locked TORN: the governor pre-vault, the
  // TornadoVault post-vault. A balance held here is voting power owned by the
  // locker, not the custody contract. TORN emits no DelegateVotesChanged, so
  // per-account voting power is derived from lock/unlock Transfers in/out of
  // these addresses. Add new lock contracts here. The governor is a treasury
  // address (not non-circulating), so it is added explicitly.
  const governorAddress = getAddress(
    CONTRACT_ADDRESSES[daoId].governor.address,
  );
  const lockCustodyAddresses = new Set<Address>([
    governorAddress,
    ...Object.values(NonCirculatingAddresses[daoId]).map((addr) =>
      getAddress(addr),
    ),
  ]);

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

    // Locks/unlocks: TORN moving in/out of governance custody — the governor
    // pre-vault, the TornadoVault post-vault (GovernanceVaultUpgrade._
    // transferTokens). Only a genuine lock()/unlock() call moves voting power,
    // and in that case the locker is always the transaction sender: lock pulls
    // TORN from msg.sender, unlock sends it back to msg.sender. TORN also
    // flows through the governor for treasury purposes — proposal executions
    // funding a contract, batch grant payouts — where the custody counterparty
    // is some arbitrary address that is NOT the tx sender. Counting those as
    // locks/unlocks mints/burns phantom voting power (e.g. proposal #6 funding
    // a staking pool booked a -120k "unlock" against a contract that never
    // locked; treasury feeders got phantom locks). Governor<->vault internal
    // moves (e.g. the v2 migration, ~2.6M TORN) have custody on both sides and
    // net to zero, so they are skipped.
    // ponytail: misses locks routed via a Safe/relayer (counterparty != tx
    // sender) — both their lock and unlock are skipped so it stays consistent
    // (undercount, never negative). Tighten with a Governance call-trace check
    // if Safe-locked TORN needs to be captured.
    const normalizedTo = getAddress(to);
    const normalizedFrom = getAddress(from);
    const toIsCustody = lockCustodyAddresses.has(normalizedTo);
    const fromIsCustody = lockCustodyAddresses.has(normalizedFrom);
    const custodyInternal = toIsCustody && fromIsCustody;
    const locker = toIsCustody ? normalizedFrom : normalizedTo;
    const isLockOrUnlock =
      toIsCustody !== fromIsCustody &&
      locker === getAddress(event.transaction.from);

    // Locked TORN is user-owned voting power, not DAO funds: genuine
    // locks/unlocks and the governor<->vault migration never touch TREASURY,
    // even though the governor is the treasury address.
    if (!isLockOrUnlock && !custodyInternal) {
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
    }

    // Locked TORN is non-circulating in every era: the vault always is; the
    // governor (a treasury address) counts only for genuine locks so
    // pre-vault locks match post-vault ones. The migration moved
    // already-counted locks between custodies, so it is skipped.
    if (!custodyInternal) {
      await updateSupplyMetric(
        context,
        "nonCirculatingSupply",
        isLockOrUnlock
          ? [...nonCirculatingAddressList, governorAddress]
          : nonCirculatingAddressList,
        MetricTypesEnum.NON_CIRCULATING_SUPPLY,
        from,
        to,
        value,
        daoId,
        address,
        timestamp,
      );
    }

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

    if (isLockOrUnlock) {
      const delta = toIsCustody ? value : -value;

      // Aggregate locked (delegated) supply.
      await updateDelegatedSupply(context, daoId, address, delta, timestamp);

      // Track the locker's per-account locked balance so a later delegation can
      // move the right amount of voting power (TORN has no DelegateVotesChanged).
      await addLockedBalance(context, locker, delta);

      // Voting power accrues to the locker's current delegate — itself unless it
      // has delegated to someone else.
      const recipient = await getDelegate(context, locker);
      await applyVotingPower(
        context,
        daoId,
        recipient,
        delta,
        event.transaction.hash,
        timestamp,
        event.log.logIndex,
      );
    }
  });

  // Voting power is derived from lock/unlock Transfers (see handler above), not
  // from these reward events — they carry only `account`, no amount. Kept as
  // no-ops so the configured events have handlers.
  // ponder.on("TORNGovernor:RewardUpdateSuccessful", async () => {});
  // ponder.on("TORNGovernor:RewardUpdateFailed", async () => {});
}
