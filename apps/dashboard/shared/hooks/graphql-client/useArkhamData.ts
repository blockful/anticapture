import {
  GetArkhamDataQuery,
  useGetArkhamDataQuery,
} from "@anticapture/graphql-client/hooks";

type ArkhamData = NonNullable<
  NonNullable<GetArkhamDataQuery["getAddress"]>["arkham"]
>;
type EnsData = NonNullable<
  NonNullable<GetArkhamDataQuery["getAddress"]>["ens"]
>;

interface ArkhamDataResult {
  arkham: ArkhamData | null;
  ens: EnsData | null;
  isContract: boolean | null;
  loading: boolean;
  error: Error | null;
}

export const useArkhamData = (
  address: string | null | undefined,
): ArkhamDataResult => {
  const { data, loading, error } = useGetArkhamDataQuery({
    variables: {
      address: address!,
    },
    skip: !address,
  });

  return {
    arkham: data?.getAddress?.arkham ?? null,
    ens: data?.getAddress?.ens ?? null,
    isContract: data?.getAddress?.isContract ?? null,
    loading,
    error: error || null,
  };
};
