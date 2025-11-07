import { BACKEND_ENDPOINT } from "@/shared/utils/server-utils";
import { DaoIdEnum } from "@/shared/types/daos";
import useSWR, { SWRConfiguration } from "swr";
import axios from "axios";

interface QuorumGapResponse {
  dao: {
    quorum: string;
  };
  compareAverageTurnout: {
    currentAverageTurnout: string;
  };
  proposals: {
    items: [{ timestamp: string }];
  };
}

/* Fetch Dao Total Supply */
export const fetchQuorumGap = async ({
  daoId,
}: {
  daoId: DaoIdEnum;
}): Promise<number | null> => {
  const days = 90;
  const limit = 1;
  const query = `
query GetDaoData {
  dao {
    quorum
  }
  proposals(limit: ${limit}) {
    items {
      timestamp
    }
  }
  compareAverageTurnout(days: _${days}d) {
      currentAverageTurnout
  }
} `;

  const response = await axios.post(
    `${BACKEND_ENDPOINT}`,
    {
      query,
    },
    {
      headers: {
        "anticapture-dao-id": daoId,
      },
    },
  );

  const data: QuorumGapResponse = response.data.data;

  console.log({ data });

  const isGapEligible =
    Math.floor((Date.now() - days) / 1000) <
    Number(data.proposals.items[0].timestamp);
  const quorum = data.dao.quorum ? Number(data.dao.quorum) / 1e18 : null;
  const avgTurnout = data.compareAverageTurnout.currentAverageTurnout
    ? Number(data.compareAverageTurnout.currentAverageTurnout) / 1e18
    : null;
  const quorumGap = quorum && avgTurnout ? (avgTurnout / quorum - 1) * 100 : 0;

  console.log({ isGapEligible, quorumGap });

  return isGapEligible ? quorumGap : null;
};

export const useQuorumGap = (
  daoId: DaoIdEnum,
  config?: Partial<SWRConfiguration<number | null, Error>>,
) => {
  const key = daoId ? [`quorumGap`, daoId] : null;

  return useSWR<number | null>(
    key,
    async () => {
      return await fetchQuorumGap({ daoId });
    },
    {
      revalidateOnFocus: false,
      ...config,
    },
  );
};
