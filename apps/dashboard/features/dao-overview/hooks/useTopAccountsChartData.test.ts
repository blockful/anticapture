import { useGetAddresses } from "@anticapture/client/hooks";
import { zeroAddress, type Address } from "viem";

import type { TopAccountChartData } from "@/features/dao-overview/components/TopAccountsChart";
import { useTopAccountsChartData } from "@/features/dao-overview/hooks/useTopAccountsChartData";

jest.mock("@anticapture/client/hooks", () => ({
  useGetAddresses: jest.fn(),
}));

const mockUseGetAddresses = jest.mocked(useGetAddresses);

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

function mockGetAddressesResult(
  results: Array<{ address: string; ensName?: string }>,
) {
  return {
    data: {
      results: results.map(({ address, ensName }) => ({
        address,
        isContract: false,
        arkham: null,
        ens: ensName
          ? { name: ensName, avatar: null, banner: null }
          : { name: null, avatar: null, banner: null },
      })),
    },
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useGetAddresses>;
}

describe("useTopAccountsChartData", () => {
  beforeEach(() => {
    mockUseGetAddresses.mockReturnValue(mockGetAddressesResult([]));
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

    expect(mockUseGetAddresses).toHaveBeenCalledWith(
      { addresses: [HOLDER_ADDRESS] },
      expect.objectContaining({
        query: expect.objectContaining({ enabled: true }),
      }),
    );
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
    mockUseGetAddresses.mockReturnValue(
      mockGetAddressesResult([
        { address: HOLDER_ADDRESS, ensName: "holder.eth" },
        { address: DELEGATE_ADDRESS, ensName: "delegate.eth" },
      ]),
    );

    const chartData = [
      createChartData({
        address: HOLDER_ADDRESS,
        delegate: DELEGATE_ADDRESS,
        delegationsCount: 2,
      }),
    ];

    const result = useTopAccountsChartData({ chartData });

    expect(mockUseGetAddresses).toHaveBeenCalledWith(
      { addresses: [HOLDER_ADDRESS, DELEGATE_ADDRESS] },
      expect.objectContaining({
        query: expect.objectContaining({ enabled: true }),
      }),
    );
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
