"use client";

import { useQuery } from "@tanstack/react-query";
import { normalize } from "viem/ens";
import { usePublicClient } from "wagmi";
import { mainnet } from "wagmi/chains";

import {
  encodeActions,
  makeAddressResolver,
} from "@/features/create-proposal/utils/encodeActions";
import { bigintValuesToStrings } from "@/features/create-proposal/utils/bigintValuesToStrings";
import type { ProposalAction } from "@/features/create-proposal/types";
import type { EncodedDraftActions } from "@/features/create-proposal/utils/draftToProposalViewData";

const EMPTY: EncodedDraftActions = { targets: [], values: [], calldatas: [] };

/**
 * Encodes a draft's structured actions into the {targets,values,calldatas}
 * string bundle consumed by ActionsTabContent. Uses the same ENS resolver as
 * the publish flow so the Preview matches what will be submitted on-chain.
 */
export const useEncodedDraftActions = (
  actions: ProposalAction[],
  daoId: string,
): {
  encoded: EncodedDraftActions;
  isLoading: boolean;
  error: Error | null;
} => {
  const ensClient = usePublicClient({ chainId: mainnet.id });

  const query = useQuery({
    queryKey: ["encoded-draft-actions", daoId, actions],
    enabled: actions.length > 0 && !!ensClient,
    queryFn: async (): Promise<EncodedDraftActions> => {
      if (!ensClient) return EMPTY;
      const resolver = makeAddressResolver(async (name) =>
        ensClient.getEnsAddress({ name: normalize(name) }),
      );
      const result = await encodeActions(actions, resolver);
      return {
        targets: result.targets,
        values: bigintValuesToStrings(result.values),
        calldatas: result.calldatas,
      };
    },
  });

  return {
    encoded: actions.length === 0 ? EMPTY : (query.data ?? EMPTY),
    isLoading: query.isLoading && actions.length > 0,
    error: (query.error as Error | null) ?? null,
  };
};
