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
        // `address` is already lowercased via uniqueAddresses above.
        const result = await efpClient.getFollowerState(
          address,
          normalizedViewer,
        );
        if (result.outcome === "error") {
          throw new Error("EFP follower state upstream failed");
        }
        if (
          result.outcome === "success" &&
          result.state.state.follow &&
          !result.state.state.block &&
          !result.state.state.mute
        ) {
          return address;
        }
        return null;
      }),
    );
    followed.push(...results.filter((addr): addr is string => addr !== null));
  }

  return followed;
}
