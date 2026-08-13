import { Address, Hex } from "viem";

/** Execution payload of a Governor proposal, as passed to queue()/execute(). */
export interface ProposalArgs {
  targets: Address[];
  values: bigint[];
  calldatas: Hex[];
  description: string;
}

export interface ProposalSource {
  /** Resolves to null when the proposal is unknown. */
  getProposal(proposalId: string): Promise<ProposalArgs | null>;
}

/**
 * Reads proposal execution args from the Anticapture REST API
 * (GET /proposals/{id}). The data is treated as untrusted: callers must
 * verify it against the governor's hashProposal before broadcasting.
 */
export class AnticaptureProposalSource implements ProposalSource {
  private baseUrl: string;

  constructor(
    baseUrl: string,
    private fetchFn: typeof fetch = fetch,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async getProposal(proposalId: string): Promise<ProposalArgs | null> {
    const response = await this.fetchFn(
      `${this.baseUrl}/proposals/${proposalId}`,
    );

    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(
        `Anticapture proposal fetch failed with status ${response.status}`,
      );
    }

    const body = (await response.json()) as {
      targets?: string[];
      values?: string[];
      calldatas?: string[];
      description?: string;
    };

    if (!body.targets || !body.values || !body.calldatas || !body.description) {
      throw new Error(
        `Anticapture proposal response is missing execution args for proposal ${proposalId}`,
      );
    }

    return {
      targets: body.targets as Address[],
      values: body.values.map(BigInt),
      calldatas: body.calldatas as Hex[],
      description: body.description,
    };
  }
}
