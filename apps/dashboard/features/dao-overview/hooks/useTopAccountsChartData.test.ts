import { zeroAddress, type Address } from "viem";

import type { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";
import { useTopAccountsChartData } from "@/features/dao-overview/hooks/useTopAccountsChartData";
import { useMultipleEnsData } from "@/shared/hooks/useEnsData";

jest.mock("@/shared/hooks/useEnsData", () => ({
  useMultipleEnsData: jest.fn(),
}));

const mockUseMultipleEnsData = jest.mocked(useMultipleEnsData);

const HOLDER_ADDRESS: Address = "0x1111111111111111111111111111111111111111";
const DELEGATE_ADDRESS: Address = "0x2222222222222222222222222222222222222222";

function createChartData(
  override: Partial<TopAccountChartData>,
): TopAccountChartData {
  return {
    address: HOLDER_ADDRESS,
    balance: 100,
    variation: {
      absoluteChange: 10,
      percentageChange: 5,
    },
    ...override,
  };
}

describe("useTopAccountsChartData", () => {
  beforeEach(() => {
    mockUseMultipleEnsData.mockReturnValue({
      data: {},
      error: undefined,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("excludes zero-address delegates from ENS lookups and chart delegate labels", () => {
    const chartData = [
      createChartData({
        delegate: zeroAddress,
      }),
    ];

    const result = useTopAccountsChartData({ chartData });

    expect(mockUseMultipleEnsData).toHaveBeenCalledWith([HOLDER_ADDRESS]);
    expect(result).toEqual({
      data: [
        {
          address: HOLDER_ADDRESS,
          balance: 100,
          variation: {
            absoluteChange: 10,
            percentageChange: 5,
          },
          delegate: zeroAddress,
          name: undefined,
          latestDelegate: undefined,
          totalDelegators: 0,
        },
      ],
    });
  });

  test("enriches non-zero delegates with ENS names", () => {
    mockUseMultipleEnsData.mockReturnValue({
      data: {
        [HOLDER_ADDRESS]: {
          address: HOLDER_ADDRESS,
          ens: "holder.eth",
          avatarUrl: null,
        },
        [DELEGATE_ADDRESS]: {
          address: DELEGATE_ADDRESS,
          ens: "delegate.eth",
          avatarUrl: null,
        },
      },
      error: undefined,
      isLoading: false,
    });

    const chartData = [
      createChartData({
        address: HOLDER_ADDRESS,
        delegate: DELEGATE_ADDRESS,
        delegationsCount: 2,
      }),
    ];

    const result = useTopAccountsChartData({ chartData });

    expect(mockUseMultipleEnsData).toHaveBeenCalledWith([
      HOLDER_ADDRESS,
      DELEGATE_ADDRESS,
    ]);
    expect(result).toEqual({
      data: [
        {
          address: HOLDER_ADDRESS,
          balance: 100,
          variation: {
            absoluteChange: 10,
            percentageChange: 5,
          },
          delegate: DELEGATE_ADDRESS,
          delegationsCount: 2,
          name: "holder.eth",
          latestDelegate: "delegate.eth",
          totalDelegators: 2,
        },
      ],
    });
  });
});
