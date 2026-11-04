import type { meterProvider } from "@/instrumentation";
import type { RelayerStatusService } from "@/services/status/relayer-status";

type Meter = ReturnType<(typeof meterProvider)["getMeter"]>;

export type StatusMeter = Pick<
  Meter,
  "createObservableGauge" | "addBatchObservableCallback"
>;

/**
 * Publishes GET /relay/status on /metrics, so a relayer that stops being able
 * to sponsor transactions pages someone instead of only changing what the
 * dashboard offers. Voters keep voting from their wallets either way, which
 * is exactly why nobody notices without this: the outage is silent.
 *
 * The gauges are read on each scrape and go through getStatus(), so they
 * share its cache and its never-throw guarantee, and the status is evaluated
 * on Prometheus' schedule even when no dashboard is polling.
 */
export const registerStatusMetrics = (
  meter: StatusMeter,
  status: Pick<RelayerStatusService, "getStatus">,
  dao: string,
): void => {
  const available = meter.createObservableGauge("relayer_gasless_available", {
    description:
      "1 when GET /relay/status reports gasless relaying available, 0 otherwise.",
  });
  const unavailableReason = meter.createObservableGauge(
    "relayer_gasless_unavailable_reason",
    {
      description:
        "1 for each reason GET /relay/status currently reports gasless relaying unavailable.",
    },
  );

  meter.addBatchObservableCallback(
    async (observer) => {
      const current = await status.getStatus();
      observer.observe(available, current.available ? 1 : 0, { dao });
      for (const reason of current.reasons) {
        observer.observe(unavailableReason, 1, { dao, reason });
      }
    },
    [available, unavailableReason],
  );
};
