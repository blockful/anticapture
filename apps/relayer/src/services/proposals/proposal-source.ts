import { Address, Hex } from "viem";
import {
  proposal,
  proposalPathParamsDaoEnum,
  type ProposalPathParams,
  type ResponseErrorConfig,
} from "@anticapture/client";

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

/** Gateful's typed contract is the lowercase DAO id (e.g. "ens"). */
function isSupportedDao(dao: string): dao is ProposalPathParams["dao"] {
  return dao in proposalPathParamsDaoEnum;
}

/**
 * Reads proposal execution args from the Anticapture API through the Gateful
 * gateway (GET /{dao}/proposals/{id}, @anticapture/client SDK). The data is
 * treated as untrusted: callers must verify it against the governor's
 * hashProposal before broadcasting.
 */
export class AnticaptureProposalSource implements ProposalSource {
  private dao: ProposalPathParams["dao"];

  constructor(
    private baseUrl: string,
    daoId: string,
    private apiKey: string,
  ) {
    const dao = daoId.toLowerCase();
    if (!isSupportedDao(dao)) {
      throw new Error(
        `DAO "${daoId}" is not part of the Anticapture API contract`,
      );
    }
    this.dao = dao;
  }

  async getProposal(proposalId: string): Promise<ProposalArgs | null> {
    let response;
    try {
      response = await proposal(this.dao, proposalId, undefined, {
        baseURL: this.baseUrl,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
    } catch (err) {
      const status = (err as ResponseErrorConfig).status;
      if (status === 404) return null;
      throw new Error(
        `Anticapture proposal fetch failed for proposal ${proposalId}` +
          (typeof status === "number" ? ` with status ${status}` : ""),
        { cause: err },
      );
    }

    if (response.variant !== "full") {
      throw new Error(
        `Anticapture proposal response is missing execution args for proposal ${proposalId}`,
      );
    }

    return {
      targets: [...response.targets],
      values: response.values.map((v) => BigInt(String(v))),
      calldatas: response.calldatas as Hex[],
      description: response.description,
    };
  }
}
