import type { EfpClient } from "@/clients/efp";

const DEFAULT_CONCURRENCY = 10;

/**
 * Returns addresses from the set that the viewer follows on EFP.
 */
export async function getFollowingInSet(
  efpClient: EfpClient,
  viewer: string,
  addresses: string[],
  concurrency = DEFAULT_CONCURRENCY,
): Promise<string[]> {
  const normalizedViewer = viewer.toLowerCase();
  const uniqueAddresses = [
    ...new Set(addresses.map((address) => address.toLowerCase())),
  ].filter((address) => address !== normalizedViewer);
  const followed: string[] = [];

  for (let i = 0; i < uniqueAddresses.length; i += concurrency) {
    const batch = uniqueAddresses.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (address) => {
        const target = address.toLowerCase();
        const state = await efpClient.getFollowerState(
          target,
          normalizedViewer,
        );
        if (state?.state.follow && !state.state.block && !state.state.mute) {
          return target;
        }
        return null;
      }),
    );
    followed.push(...results.filter((addr): addr is string => addr !== null));
  }

  return followed;
}
