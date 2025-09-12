import { formatEther } from "viem";

export const formatVotes = (votes: number): number => {
  if (isNaN(votes) || votes < 0) {
    return 0;
  }

  try {
    const formattedVotes = Number(formatEther(BigInt(Math.floor(votes))));
    return formattedVotes;
  } catch (error) {
    console.warn("Error formatting votes:", votes, error);
    return 0;
  }
};
