import { formatUnits } from "viem";

import type {
  ErrorResponse,
  RelayerErrorResponse,
  ResponseErrorConfig,
} from "@anticapture/client";

const INSUFFICIENT_VOTING_POWER = "INSUFFICIENT_VOTING_POWER";
const RATE_LIMITED = "RATE_LIMITED";

const GENERIC_MESSAGE =
  "Something went wrong with your operation. Try again later";
const RATE_LIMITED_MESSAGE = "You've reached maximum operations per day";

const formatThreshold = (raw: bigint, decimals: number, symbol: string) =>
  `${formatUnits(raw, decimals)} ${symbol}`;

export const mapRelayerError = (
  error: unknown,
  context: {
    operation: "vote" | "delegate";
    minVotingPower: bigint | null;
    decimals: number;
    symbol: string;
  },
): string => {
  const relayerError = error as
    | ResponseErrorConfig<ErrorResponse | RelayerErrorResponse>
    | undefined;
  const code = relayerError?.response?.data?.error;
  const status = relayerError?.status;

  if (code === INSUFFICIENT_VOTING_POWER) {
    if (context.minVotingPower === null) {
      return `You don't have sufficient voting power to ${context.operation}.`;
    }
    const formatted = formatThreshold(
      context.minVotingPower,
      context.decimals,
      context.symbol,
    );
    return `You don't have sufficient voting power to ${context.operation}. You need minimum ${formatted}`;
  }

  if (code === RATE_LIMITED || status === 429) {
    return RATE_LIMITED_MESSAGE;
  }

  return GENERIC_MESSAGE;
};

export const isUserRejection = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /rejected|denied|user (denied|rejected)/i.test(message);
};
