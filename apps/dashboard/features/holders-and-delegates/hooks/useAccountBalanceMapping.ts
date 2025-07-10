import { useMemo } from "react";
import { useVotingPower } from "@/shared/hooks/graphql-client/useVotingPower";
import { DaoIdEnum } from "@/shared/types/daos";

export const useAccountBalanceMapping = ({
  daoId,
  address,
}: {
  daoId: DaoIdEnum;
  address: string;
}) => {
  const { delegatorsVotingPowerDetails } = useVotingPower({
    daoId,
    address,
  });

  const accBalanceMapping = useMemo(() => {
    return Object.fromEntries(
      (delegatorsVotingPowerDetails?.accountBalances?.items || []).map(
        (accBalance) => [accBalance.delegate, accBalance.balance],
      ),
    );
  }, [delegatorsVotingPowerDetails?.accountBalances?.items]);

  return {
    accBalanceMapping,
    delegatorsVotingPowerDetails,
  };
};
