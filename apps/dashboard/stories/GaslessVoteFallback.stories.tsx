import type { Meta, StoryObj } from "@storybook/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  decodeFunctionData,
  encodeFunctionResult,
  parseAbi,
  type Address,
} from "viem";
import { mainnet } from "viem/chains";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mock } from "wagmi/connectors";

import type {
  RelayerRateLimitResponse,
  RelayerStatusResponse,
} from "@anticapture/client";

import { VotingModal } from "@/features/governance/components/modals/VotingModal";
import {
  ProposalStatus,
  type ProposalDetails,
} from "@/features/governance/types";
import { DaoIdEnum } from "@/shared/types/daos";

/**
 * Every way the ENS ballot reaches the wallet when the gasless relayer cannot
 * be used, rendered from the real VotingModal. The wallet is wagmi's mock
 * connector and both the chain and Gateful are answered by a fetch stub, so
 * each story runs the same code path the page does with the relayer in that
 * state.
 */

const VOTER: Address = "0x76A6D08b82034b397E7e09dAe4377C18F132BbB8";
const MOCK_RPC_URL = "https://mock-rpc.anticapture.local";
const VOTING_POWER = "125000000000000000000000";

const governorAbi = parseAbi([
  "function name() view returns (string)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
]);

// Mainnet's id with an RPC the stub answers, so neither the mock connector
// nor the public client ever leaves the page.
const mockMainnet = {
  ...mainnet,
  rpcUrls: { default: { http: [MOCK_RPC_URL] } },
} as const;

const AVAILABLE: RelayerStatusResponse = {
  available: true,
  reasons: [],
  checkedAt: "2026-10-24T18:00:00.000Z",
};

const UNAVAILABLE: RelayerStatusResponse = {
  available: false,
  reasons: ["LOW_BALANCE"],
  checks: {
    paused: false,
    rpc: "ok",
    balance: "low",
    rateLimiter: "ok",
    pendingTransactions: "ok",
    recentRelays: "ok",
  },
  checkedAt: "2026-10-24T18:00:00.000Z",
};

const RATE_LIMIT: RelayerRateLimitResponse = {
  address: VOTER,
  vote: { used: 0, remaining: 3, limit: 3 },
  delegation: { used: 0, remaining: 3, limit: 3 },
  resetsAt: "2026-11-01T00:00:00.000Z",
};

type RelayAnswer = "refused-low-balance" | "no-answer";

interface Scenario {
  status: RelayerStatusResponse;
  relay?: RelayAnswer;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const answerRpc = (method: string, params: unknown[] | undefined): unknown => {
  switch (method) {
    case "eth_chainId":
      return "0x1";
    case "eth_accounts":
    case "eth_requestAccounts":
      return [VOTER];
    case "eth_blockNumber":
      return "0x1";
    case "eth_signTypedData_v4":
      return `0x${"11".repeat(32)}${"22".repeat(32)}1b`;
    case "eth_call": {
      const [call] = (params ?? []) as [{ data: `0x${string}` }];
      const { functionName } = decodeFunctionData({
        abi: governorAbi,
        data: call.data,
      });
      return functionName === "name"
        ? encodeFunctionResult({
            abi: governorAbi,
            functionName: "name",
            result: "ENS Governor",
          })
        : encodeFunctionResult({
            abi: governorAbi,
            functionName: "hasVoted",
            result: false,
          });
    }
    default:
      return null;
  }
};

const answerGateful = (path: string, scenario: Scenario): Response => {
  if (path.endsWith("/relay/status")) return json(scenario.status);
  if (path.endsWith("/relay/config")) {
    return json({
      minVotingPower: "1000000000000000000",
      limits: { vote: 3, delegation: 3 },
    });
  }
  if (path.includes("/relay/rate-limit/")) return json(RATE_LIMIT);
  if (path.includes("/voting-powers/")) {
    return json({
      accountId: VOTER,
      votingPower: VOTING_POWER,
      votesCount: 12,
      proposalsCount: 0,
      delegationsCount: 40,
    });
  }
  if (path.endsWith("/relay/vote")) {
    return scenario.relay === "refused-low-balance"
      ? json(
          {
            error: "Relayer wallet balance is too low to submit transactions",
            code: "RELAYER_LOW_BALANCE",
          },
          503,
        )
      : new Response("<html>502 Bad Gateway</html>", { status: 502 });
  }
  return json({ error: "not mocked" }, 404);
};

/** Routes every request the modal makes to this story's scenario. */
const stubNetwork = (scenario: Scenario) => {
  const realFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (url.startsWith(MOCK_RPC_URL)) {
      const body = JSON.parse(String(init?.body)) as {
        id: number;
        method: string;
        params?: unknown[];
      };
      return json({
        jsonrpc: "2.0",
        id: body.id,
        result: answerRpc(body.method, body.params),
      });
    }

    const gateful = url.indexOf("/api/gateful/");
    if (gateful !== -1) {
      const path = new URL(url, window.location.origin).pathname;
      return answerGateful(path, scenario);
    }

    return realFetch(input, init);
  };
  return () => {
    window.fetch = realFetch;
  };
};

let proposalCount = 0;

const buildProposal = (): ProposalDetails => ({
  // A proposal of its own per story: the vote store lives for the page, and
  // stories share one page.
  id: `${51915723803355532053585313225201979004629663092454892570706465301184496475700n + BigInt(proposalCount++)}`,
  daoId: "ENS",
  txHash: `0x${"ab".repeat(32)}`,
  proposerAccountId: "0x983110309620D911731Ac0932219af06091b6744",
  title: "[EP 6.32] Activate ENSv2",
  description: "",
  startBlock: 21_000_000,
  endBlock: 21_045_000,
  timestamp: 1_792_500_000,
  status: ProposalStatus.ONGOING,
  forVotes: "1400000000000000000000000",
  againstVotes: "210000000000000000000000",
  abstainVotes: "35000000000000000000000",
  quorum: "1000000000000000000000000",
  startTimestamp: 1_792_500_000,
  endTimestamp: 1_793_100_000,
  queuedTimestamp: null,
  executedTimestamp: null,
  queuedTxHash: null,
  executedTxHash: null,
  proposalType: null,
  calldatas: [],
  values: [],
  targets: [],
});

const VotingModalStory = () => {
  const [config] = useState(() =>
    createConfig({
      chains: [mockMainnet],
      connectors: [
        mock({
          accounts: [VOTER],
          features: { defaultConnected: true, reconnect: true },
        }),
      ],
      transports: { [mockMainnet.id]: http(MOCK_RPC_URL) },
      // One eth_call per read, so the stub answers the governor directly
      // instead of decoding Multicall3 batches.
      batch: { multicall: false },
    }),
  );
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  const [proposal] = useState(buildProposal);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-[760px] w-[1100px]">
          <VotingModal
            isOpen
            onClose={() => {}}
            proposal={proposal}
            votingPower="125K"
            rawVotingPower={VOTING_POWER}
            decimals={18}
            daoId={DaoIdEnum.ENS}
          />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

const meta: Meta = {
  title: "Governance/Gasless Vote Fallback",
  parameters: { layout: "fullscreen" },
  render: () => <VotingModalStory />,
};

export default meta;
type Story = StoryObj;

const page = (canvasElement: HTMLElement) =>
  within(canvasElement.ownerDocument.body);

const chooseFor = async (canvasElement: HTMLElement) => {
  const screen = page(canvasElement);
  await userEvent.click(await screen.findByText("For"));
};

/** 1. Relayer healthy: the vote is free, and the wallet is one click away. */
export const GaslessAvailable: Story = {
  beforeEach: () => stubNetwork({ status: AVAILABLE }),
  play: async ({ canvasElement }) => {
    await chooseFor(canvasElement);
    const screen = page(canvasElement);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Submit gas-free" }),
      ).toBeEnabled(),
    );
    await expect(
      screen.getByText("Pay with my wallet instead"),
    ).toBeInTheDocument();
  },
};

/** 2. The voter opts out of the relayer and pays gas themselves. */
export const WalletChosen: Story = {
  beforeEach: () => stubNetwork({ status: AVAILABLE }),
  play: async ({ canvasElement }) => {
    await chooseFor(canvasElement);
    const screen = page(canvasElement);
    await userEvent.click(
      await screen.findByText("Pay with my wallet instead"),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Vote with wallet" }),
      ).toBeEnabled(),
    );
  },
};

/** 3. The status endpoint says the relayer cannot be used right now. */
export const RelayerUnavailable: Story = {
  beforeEach: () => stubNetwork({ status: UNAVAILABLE }),
  play: async ({ canvasElement }) => {
    await chooseFor(canvasElement);
    const screen = page(canvasElement);
    await screen.findByText(/Gas-free voting is unavailable right now/);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Vote with wallet" }),
      ).toBeEnabled(),
    );
  },
};

/** 4. The status said yes, but the relay was refused before broadcasting. */
export const GaslessRefused: Story = {
  beforeEach: () =>
    stubNetwork({ status: AVAILABLE, relay: "refused-low-balance" }),
  play: async ({ canvasElement }) => {
    await chooseFor(canvasElement);
    const screen = page(canvasElement);
    const submit = await screen.findByRole("button", {
      name: "Submit gas-free",
    });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.click(submit);
    await screen.findByText(/The relayer is out of funds/);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Vote with wallet" }),
      ).toBeEnabled(),
    );
  },
};

/** 5. The relayer never answered: the vote may or may not have been sent. */
export const RelayerNoAnswer: Story = {
  beforeEach: () => stubNetwork({ status: AVAILABLE, relay: "no-answer" }),
  play: async ({ canvasElement }) => {
    await chooseFor(canvasElement);
    const screen = page(canvasElement);
    const submit = await screen.findByRole("button", {
      name: "Submit gas-free",
    });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.click(submit);
    await screen.findByRole("button", { name: /Vote with my wallet instead/ });
  },
};

/** 6. From there, the chain shows no vote, so the wallet takes the ballot. */
export const FallbackFromNoAnswer: Story = {
  beforeEach: () => stubNetwork({ status: AVAILABLE, relay: "no-answer" }),
  play: async ({ canvasElement }) => {
    await chooseFor(canvasElement);
    const screen = page(canvasElement);
    const submit = await screen.findByRole("button", {
      name: "Submit gas-free",
    });
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.click(submit);
    await userEvent.click(
      await screen.findByRole("button", {
        name: /Vote with my wallet instead/,
      }),
    );
    // The ballot's own alert, not the pending screen's, which opens with the
    // same sentence.
    await screen.findByText(
      /did not confirm your vote\. You can still vote with your wallet/,
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Vote with wallet" }),
      ).toBeEnabled(),
    );
  },
};
