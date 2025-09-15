import { formatEther } from "viem";

export const formatVotes = (votes: number): string => {
  if (isNaN(votes) || votes < 0) {
    return "0";
  }

  try {
    const formattedVotes = formatEther(BigInt(Math.floor(votes)));
    // Cut to 2 decimal places
    const parts = formattedVotes.split(".");
    if (parts.length === 2) {
      return `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    return formattedVotes;
  } catch (error) {
    console.warn("Error formatting votes:", votes, error);
    return "0";
  }
};
