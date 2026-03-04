import {
  type GetAddressDataQuery,
  useGetAddressDataQuery,
} from "@anticapture/graphql-client/hooks";

type ArkhamData = NonNullable<
  NonNullable<GetAddressDataQuery["getAddress"]>["arkham"]
>;
type EnsData = NonNullable<
  NonNullable<GetAddressDataQuery["getAddress"]>["ens"]
>;

export interface ArkhamDataResult {
  arkhamData: ArkhamData | null;
  ens: EnsData | null;
  isContract: boolean | null;
  isLoading: boolean;
  error: Error | null;
}

export const useArkhamData = (
  address: string | null | undefined,
): ArkhamDataResult => {
  const {
    data,
    loading: isLoading,
    error,
  } = useGetAddressDataQuery({
    variables: {
      address: address!,
    },
    skip: !address,
  });

  return {
    arkhamData: data?.getAddress?.arkham ?? null,
    ens: data?.getAddress?.ens ?? null,
    isContract: data?.getAddress?.isContract ?? null,
    isLoading,
    error: error || null,
  };
};
