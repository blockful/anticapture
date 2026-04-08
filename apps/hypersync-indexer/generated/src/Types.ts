// This file is to dynamically generate TS types
// which we can't get using GenType
// Use @genType.import to link the types back to ReScript code

import type { Logger, EffectCaller } from "envio";
import type * as Entities from "./db/Entities.gen.ts";

export type LoaderContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * True when the handlers run in preload mode - in parallel for the whole batch.
   * Handlers run twice per batch of events, and the first time is the "preload" run
   * During preload entities aren't set, logs are ignored and exceptions are silently swallowed.
   * Preload mode is the best time to populate data to in-memory cache.
   * After preload the handler will run for the second time in sequential order of events.
   */
  readonly isPreload: boolean;
  /**
   * Per-chain state information accessible in event handlers and block handlers.
   * Each chain ID maps to an object containing chain-specific state:
   * - isReady: true when the chain has completed initial sync and is processing live events,
   *            false during historical synchronization
   */
  readonly chains: {
    [chainId: string]: {
      readonly isReady: boolean;
    };
  };
  readonly Account: {
    /**
     * Load the entity Account from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Account_t | undefined>,
    /**
     * Load the entity Account from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Account_t>,
    readonly getWhere: Entities.Account_indexedFieldOperations,
    /**
     * Returns the entity Account from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Account_t) => Promise<Entities.Account_t>,
    /**
     * Set the entity Account in the storage.
     */
    readonly set: (entity: Entities.Account_t) => void,
    /**
     * Delete the entity Account from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly AccountBalance: {
    /**
     * Load the entity AccountBalance from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.AccountBalance_t | undefined>,
    /**
     * Load the entity AccountBalance from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.AccountBalance_t>,
    readonly getWhere: Entities.AccountBalance_indexedFieldOperations,
    /**
     * Returns the entity AccountBalance from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.AccountBalance_t) => Promise<Entities.AccountBalance_t>,
    /**
     * Set the entity AccountBalance in the storage.
     */
    readonly set: (entity: Entities.AccountBalance_t) => void,
    /**
     * Delete the entity AccountBalance from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly AccountPower: {
    /**
     * Load the entity AccountPower from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.AccountPower_t | undefined>,
    /**
     * Load the entity AccountPower from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.AccountPower_t>,
    readonly getWhere: Entities.AccountPower_indexedFieldOperations,
    /**
     * Returns the entity AccountPower from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.AccountPower_t) => Promise<Entities.AccountPower_t>,
    /**
     * Set the entity AccountPower in the storage.
     */
    readonly set: (entity: Entities.AccountPower_t) => void,
    /**
     * Delete the entity AccountPower from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly BalanceHistory: {
    /**
     * Load the entity BalanceHistory from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.BalanceHistory_t | undefined>,
    /**
     * Load the entity BalanceHistory from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.BalanceHistory_t>,
    readonly getWhere: Entities.BalanceHistory_indexedFieldOperations,
    /**
     * Returns the entity BalanceHistory from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.BalanceHistory_t) => Promise<Entities.BalanceHistory_t>,
    /**
     * Set the entity BalanceHistory in the storage.
     */
    readonly set: (entity: Entities.BalanceHistory_t) => void,
    /**
     * Delete the entity BalanceHistory from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly DaoMetricsDayBucket: {
    /**
     * Load the entity DaoMetricsDayBucket from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.DaoMetricsDayBucket_t | undefined>,
    /**
     * Load the entity DaoMetricsDayBucket from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.DaoMetricsDayBucket_t>,
    readonly getWhere: Entities.DaoMetricsDayBucket_indexedFieldOperations,
    /**
     * Returns the entity DaoMetricsDayBucket from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.DaoMetricsDayBucket_t) => Promise<Entities.DaoMetricsDayBucket_t>,
    /**
     * Set the entity DaoMetricsDayBucket in the storage.
     */
    readonly set: (entity: Entities.DaoMetricsDayBucket_t) => void,
    /**
     * Delete the entity DaoMetricsDayBucket from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Delegation: {
    /**
     * Load the entity Delegation from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Delegation_t | undefined>,
    /**
     * Load the entity Delegation from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Delegation_t>,
    readonly getWhere: Entities.Delegation_indexedFieldOperations,
    /**
     * Returns the entity Delegation from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Delegation_t) => Promise<Entities.Delegation_t>,
    /**
     * Set the entity Delegation in the storage.
     */
    readonly set: (entity: Entities.Delegation_t) => void,
    /**
     * Delete the entity Delegation from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly FeedEvent: {
    /**
     * Load the entity FeedEvent from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.FeedEvent_t | undefined>,
    /**
     * Load the entity FeedEvent from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.FeedEvent_t>,
    readonly getWhere: Entities.FeedEvent_indexedFieldOperations,
    /**
     * Returns the entity FeedEvent from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.FeedEvent_t) => Promise<Entities.FeedEvent_t>,
    /**
     * Set the entity FeedEvent in the storage.
     */
    readonly set: (entity: Entities.FeedEvent_t) => void,
    /**
     * Delete the entity FeedEvent from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly ProposalOnchain: {
    /**
     * Load the entity ProposalOnchain from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.ProposalOnchain_t | undefined>,
    /**
     * Load the entity ProposalOnchain from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.ProposalOnchain_t>,
    readonly getWhere: Entities.ProposalOnchain_indexedFieldOperations,
    /**
     * Returns the entity ProposalOnchain from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.ProposalOnchain_t) => Promise<Entities.ProposalOnchain_t>,
    /**
     * Set the entity ProposalOnchain in the storage.
     */
    readonly set: (entity: Entities.ProposalOnchain_t) => void,
    /**
     * Delete the entity ProposalOnchain from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Token: {
    /**
     * Load the entity Token from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Token_t | undefined>,
    /**
     * Load the entity Token from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Token_t>,
    readonly getWhere: Entities.Token_indexedFieldOperations,
    /**
     * Returns the entity Token from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Token_t) => Promise<Entities.Token_t>,
    /**
     * Set the entity Token in the storage.
     */
    readonly set: (entity: Entities.Token_t) => void,
    /**
     * Delete the entity Token from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly TokenPrice: {
    /**
     * Load the entity TokenPrice from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.TokenPrice_t | undefined>,
    /**
     * Load the entity TokenPrice from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.TokenPrice_t>,
    readonly getWhere: Entities.TokenPrice_indexedFieldOperations,
    /**
     * Returns the entity TokenPrice from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.TokenPrice_t) => Promise<Entities.TokenPrice_t>,
    /**
     * Set the entity TokenPrice in the storage.
     */
    readonly set: (entity: Entities.TokenPrice_t) => void,
    /**
     * Delete the entity TokenPrice from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Transaction: {
    /**
     * Load the entity Transaction from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Transaction_t | undefined>,
    /**
     * Load the entity Transaction from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Transaction_t>,
    readonly getWhere: Entities.Transaction_indexedFieldOperations,
    /**
     * Returns the entity Transaction from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Transaction_t) => Promise<Entities.Transaction_t>,
    /**
     * Set the entity Transaction in the storage.
     */
    readonly set: (entity: Entities.Transaction_t) => void,
    /**
     * Delete the entity Transaction from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Transfer: {
    /**
     * Load the entity Transfer from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Transfer_t | undefined>,
    /**
     * Load the entity Transfer from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Transfer_t>,
    readonly getWhere: Entities.Transfer_indexedFieldOperations,
    /**
     * Returns the entity Transfer from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Transfer_t) => Promise<Entities.Transfer_t>,
    /**
     * Set the entity Transfer in the storage.
     */
    readonly set: (entity: Entities.Transfer_t) => void,
    /**
     * Delete the entity Transfer from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly VoteOnchain: {
    /**
     * Load the entity VoteOnchain from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.VoteOnchain_t | undefined>,
    /**
     * Load the entity VoteOnchain from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.VoteOnchain_t>,
    readonly getWhere: Entities.VoteOnchain_indexedFieldOperations,
    /**
     * Returns the entity VoteOnchain from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.VoteOnchain_t) => Promise<Entities.VoteOnchain_t>,
    /**
     * Set the entity VoteOnchain in the storage.
     */
    readonly set: (entity: Entities.VoteOnchain_t) => void,
    /**
     * Delete the entity VoteOnchain from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly VotingPowerHistory: {
    /**
     * Load the entity VotingPowerHistory from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.VotingPowerHistory_t | undefined>,
    /**
     * Load the entity VotingPowerHistory from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.VotingPowerHistory_t>,
    readonly getWhere: Entities.VotingPowerHistory_indexedFieldOperations,
    /**
     * Returns the entity VotingPowerHistory from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.VotingPowerHistory_t) => Promise<Entities.VotingPowerHistory_t>,
    /**
     * Set the entity VotingPowerHistory in the storage.
     */
    readonly set: (entity: Entities.VotingPowerHistory_t) => void,
    /**
     * Delete the entity VotingPowerHistory from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};

export type HandlerContext = {
  /**
   * Access the logger instance with event as a context. The logs will be displayed in the console and Envio Hosted Service.
   */
  readonly log: Logger;
  /**
   * Call the provided Effect with the given input.
   * Effects are the best for external calls with automatic deduplication, error handling and caching.
   * Define a new Effect using createEffect outside of the handler.
   */
  readonly effect: EffectCaller;
  /**
   * Per-chain state information accessible in event handlers and block handlers.
   * Each chain ID maps to an object containing chain-specific state:
   * - isReady: true when the chain has completed initial sync and is processing live events,
   *            false during historical synchronization
   */
  readonly chains: {
    [chainId: string]: {
      readonly isReady: boolean;
    };
  };
  readonly Account: {
    /**
     * Load the entity Account from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Account_t | undefined>,
    /**
     * Load the entity Account from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Account_t>,
    /**
     * Returns the entity Account from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Account_t) => Promise<Entities.Account_t>,
    /**
     * Set the entity Account in the storage.
     */
    readonly set: (entity: Entities.Account_t) => void,
    /**
     * Delete the entity Account from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly AccountBalance: {
    /**
     * Load the entity AccountBalance from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.AccountBalance_t | undefined>,
    /**
     * Load the entity AccountBalance from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.AccountBalance_t>,
    /**
     * Returns the entity AccountBalance from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.AccountBalance_t) => Promise<Entities.AccountBalance_t>,
    /**
     * Set the entity AccountBalance in the storage.
     */
    readonly set: (entity: Entities.AccountBalance_t) => void,
    /**
     * Delete the entity AccountBalance from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly AccountPower: {
    /**
     * Load the entity AccountPower from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.AccountPower_t | undefined>,
    /**
     * Load the entity AccountPower from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.AccountPower_t>,
    /**
     * Returns the entity AccountPower from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.AccountPower_t) => Promise<Entities.AccountPower_t>,
    /**
     * Set the entity AccountPower in the storage.
     */
    readonly set: (entity: Entities.AccountPower_t) => void,
    /**
     * Delete the entity AccountPower from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly BalanceHistory: {
    /**
     * Load the entity BalanceHistory from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.BalanceHistory_t | undefined>,
    /**
     * Load the entity BalanceHistory from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.BalanceHistory_t>,
    /**
     * Returns the entity BalanceHistory from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.BalanceHistory_t) => Promise<Entities.BalanceHistory_t>,
    /**
     * Set the entity BalanceHistory in the storage.
     */
    readonly set: (entity: Entities.BalanceHistory_t) => void,
    /**
     * Delete the entity BalanceHistory from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly DaoMetricsDayBucket: {
    /**
     * Load the entity DaoMetricsDayBucket from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.DaoMetricsDayBucket_t | undefined>,
    /**
     * Load the entity DaoMetricsDayBucket from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.DaoMetricsDayBucket_t>,
    /**
     * Returns the entity DaoMetricsDayBucket from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.DaoMetricsDayBucket_t) => Promise<Entities.DaoMetricsDayBucket_t>,
    /**
     * Set the entity DaoMetricsDayBucket in the storage.
     */
    readonly set: (entity: Entities.DaoMetricsDayBucket_t) => void,
    /**
     * Delete the entity DaoMetricsDayBucket from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Delegation: {
    /**
     * Load the entity Delegation from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Delegation_t | undefined>,
    /**
     * Load the entity Delegation from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Delegation_t>,
    /**
     * Returns the entity Delegation from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Delegation_t) => Promise<Entities.Delegation_t>,
    /**
     * Set the entity Delegation in the storage.
     */
    readonly set: (entity: Entities.Delegation_t) => void,
    /**
     * Delete the entity Delegation from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly FeedEvent: {
    /**
     * Load the entity FeedEvent from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.FeedEvent_t | undefined>,
    /**
     * Load the entity FeedEvent from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.FeedEvent_t>,
    /**
     * Returns the entity FeedEvent from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.FeedEvent_t) => Promise<Entities.FeedEvent_t>,
    /**
     * Set the entity FeedEvent in the storage.
     */
    readonly set: (entity: Entities.FeedEvent_t) => void,
    /**
     * Delete the entity FeedEvent from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly ProposalOnchain: {
    /**
     * Load the entity ProposalOnchain from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.ProposalOnchain_t | undefined>,
    /**
     * Load the entity ProposalOnchain from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.ProposalOnchain_t>,
    /**
     * Returns the entity ProposalOnchain from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.ProposalOnchain_t) => Promise<Entities.ProposalOnchain_t>,
    /**
     * Set the entity ProposalOnchain in the storage.
     */
    readonly set: (entity: Entities.ProposalOnchain_t) => void,
    /**
     * Delete the entity ProposalOnchain from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Token: {
    /**
     * Load the entity Token from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Token_t | undefined>,
    /**
     * Load the entity Token from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Token_t>,
    /**
     * Returns the entity Token from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Token_t) => Promise<Entities.Token_t>,
    /**
     * Set the entity Token in the storage.
     */
    readonly set: (entity: Entities.Token_t) => void,
    /**
     * Delete the entity Token from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly TokenPrice: {
    /**
     * Load the entity TokenPrice from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.TokenPrice_t | undefined>,
    /**
     * Load the entity TokenPrice from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.TokenPrice_t>,
    /**
     * Returns the entity TokenPrice from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.TokenPrice_t) => Promise<Entities.TokenPrice_t>,
    /**
     * Set the entity TokenPrice in the storage.
     */
    readonly set: (entity: Entities.TokenPrice_t) => void,
    /**
     * Delete the entity TokenPrice from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Transaction: {
    /**
     * Load the entity Transaction from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Transaction_t | undefined>,
    /**
     * Load the entity Transaction from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Transaction_t>,
    /**
     * Returns the entity Transaction from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Transaction_t) => Promise<Entities.Transaction_t>,
    /**
     * Set the entity Transaction in the storage.
     */
    readonly set: (entity: Entities.Transaction_t) => void,
    /**
     * Delete the entity Transaction from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly Transfer: {
    /**
     * Load the entity Transfer from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.Transfer_t | undefined>,
    /**
     * Load the entity Transfer from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.Transfer_t>,
    /**
     * Returns the entity Transfer from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.Transfer_t) => Promise<Entities.Transfer_t>,
    /**
     * Set the entity Transfer in the storage.
     */
    readonly set: (entity: Entities.Transfer_t) => void,
    /**
     * Delete the entity Transfer from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly VoteOnchain: {
    /**
     * Load the entity VoteOnchain from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.VoteOnchain_t | undefined>,
    /**
     * Load the entity VoteOnchain from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.VoteOnchain_t>,
    /**
     * Returns the entity VoteOnchain from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.VoteOnchain_t) => Promise<Entities.VoteOnchain_t>,
    /**
     * Set the entity VoteOnchain in the storage.
     */
    readonly set: (entity: Entities.VoteOnchain_t) => void,
    /**
     * Delete the entity VoteOnchain from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
  readonly VotingPowerHistory: {
    /**
     * Load the entity VotingPowerHistory from the storage by ID.
     * If the entity is not found, returns undefined.
     */
    readonly get: (id: string) => Promise<Entities.VotingPowerHistory_t | undefined>,
    /**
     * Load the entity VotingPowerHistory from the storage by ID.
     * If the entity is not found, throws an error.
     */
    readonly getOrThrow: (id: string, message?: string) => Promise<Entities.VotingPowerHistory_t>,
    /**
     * Returns the entity VotingPowerHistory from the storage by ID.
     * If the entity is not found, creates it using provided parameters and returns it.
     */
    readonly getOrCreate: (entity: Entities.VotingPowerHistory_t) => Promise<Entities.VotingPowerHistory_t>,
    /**
     * Set the entity VotingPowerHistory in the storage.
     */
    readonly set: (entity: Entities.VotingPowerHistory_t) => void,
    /**
     * Delete the entity VotingPowerHistory from the storage.
     *
     * The 'deleteUnsafe' method is experimental and unsafe. You should manually handle all entity references after deletion to maintain database consistency.
     */
    readonly deleteUnsafe: (id: string) => void,
  }
};
