import type { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { createLogger, type Logger } from "@anticapture/observability";

import { RelayError } from "@/errors";
import { RelayWebhookBodySchema } from "@/schemas/relay-webhook";
import type { ProposalEnactmentService } from "@/services/proposals/proposal-enactment";

export type WebhookOutcome =
  | "queued"
  | "executed"
  | "skipped"
  | "ignored"
  | "failed";

// Only these RelayError codes mean "nothing to do right now" (not ready,
// would revert): expected in normal operation, not failures. Everything
// else — including TRANSACTION_REVERTED (gas was spent on a mined revert),
// other RelayErrors (404/503), and plain errors — is a failure.
const SKIPPED_CODES = new Set([
  "INVALID_PROPOSAL_STATE",
  "TIMELOCK_NOT_READY",
  "SIMULATION_FAILED",
]);

export interface RelayWebhookOptions {
  /** Called once per webhook with the final outcome; index.ts feeds a Prometheus counter. */
  onOutcome?: (outcome: WebhookOutcome) => void;
  logger?: Logger;
  /** DAO this relayer serves. Events whose metadata.daoId doesn't match (case-insensitive) are ignored. */
  daoId?: string;
}

/**
 * Receiver for notification-system webhooks (ProposalFinished / ProposalExecutable).
 *
 * Served under /internal/ so gateful's /:dao/relay/* proxy cannot reach it;
 * only Railway private networking can. It carries no auth, and it is kept
 * out of the OpenAPI spec so the generated SDK does not grow a method nobody
 * outside the relayer should call.
 *
 * Always answers 202 right away: the sender times out at 30s and a mainnet
 * receipt wait can take longer. The outcome goes to logs and metrics instead.
 */
export function relayWebhook(
  app: Hono,
  enactment: Pick<ProposalEnactmentService, "enact">,
  options: RelayWebhookOptions = {},
) {
  const logger = options.logger ?? createLogger("relayer-webhook");
  const report = (outcome: WebhookOutcome, fields: Record<string, unknown>) => {
    try {
      options.onOutcome?.(outcome);
      const level = outcome === "failed" ? "error" : "info";
      logger[level]({ outcome, ...fields }, `webhook ${outcome}`);
    } catch {
      // reporting must never break the webhook
    }
  };

  app.post("/internal/webhook", async (c) => {
    const parsed = RelayWebhookBodySchema.safeParse(
      await c.req.json().catch(() => null),
    );

    if (!parsed.success) {
      report("ignored", {
        reason: "body did not match the webhook envelope",
        issues: parsed.error.issues.map((issue) => issue.path.join(".")),
      });
      return c.json({ accepted: true }, 202);
    }

    const eventDaoId = parsed.data.metadata?.daoId;
    if (
      options.daoId !== undefined &&
      typeof eventDaoId === "string" &&
      eventDaoId.toLowerCase() !== options.daoId.toLowerCase()
    ) {
      report("ignored", {
        reason: "event for another DAO",
        daoId: eventDaoId,
      });
      return c.json({ accepted: true }, 202);
    }

    const proposalId = parsed.data.metadata?.proposalId;
    if (proposalId === undefined) {
      report("ignored", { reason: "no proposalId in metadata" });
      return c.json({ accepted: true }, 202);
    }

    // Fire-and-forget: the response must not wait for the broadcast.
    void enactment
      .enact(proposalId.toString())
      .then((result) => {
        if (result.action === "skipped") {
          report("skipped", {
            proposalId: proposalId.toString(),
            state: result.state,
          });
        } else {
          report(result.action === "queue" ? "queued" : "executed", {
            proposalId: proposalId.toString(),
            txHash: result.txHash,
          });
        }
      })
      .catch((err: unknown) => {
        if (err instanceof RelayError && SKIPPED_CODES.has(err.code)) {
          report("skipped", {
            proposalId: proposalId.toString(),
            code: err.code,
            reason: err.message,
          });
        } else if (err instanceof RelayError) {
          report("failed", {
            proposalId: proposalId.toString(),
            code: err.code,
            err,
          });
        } else {
          report("failed", { proposalId: proposalId.toString(), err });
        }
      });

    return c.json({ accepted: true }, 202);
  });
}
