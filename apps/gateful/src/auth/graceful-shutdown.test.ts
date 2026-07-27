import { describe, expect, it, vi } from "vitest";

import { drainServerAndFlushUsage } from "./graceful-shutdown";
import type { ClosableServer, UsageFlusher } from "./graceful-shutdown";

describe("drainServerAndFlushUsage", () => {
  it("waits for active requests to drain before flushing usage", async () => {
    let finishClose: (() => void) | undefined;
    const events: string[] = [];
    const server: ClosableServer = {
      close: (callback) => {
        events.push("close");
        finishClose = callback;
      },
    };
    const usage: UsageFlusher = {
      stop: vi.fn(async () => {
        events.push("flush");
      }),
    };

    const shutdown = drainServerAndFlushUsage(server, usage);
    await Promise.resolve();
    expect(events).toEqual(["close"]);

    finishClose?.();
    await shutdown;

    expect(events).toEqual(["close", "flush"]);
  });

  it("still flushes usage when closing the server reports an error", async () => {
    const closeError = new Error("close failed");
    const server: ClosableServer = {
      close: (callback) => callback(closeError),
    };
    const usage: UsageFlusher = { stop: vi.fn(async () => undefined) };

    await expect(drainServerAndFlushUsage(server, usage)).rejects.toBe(
      closeError,
    );
    expect(usage.stop).toHaveBeenCalledTimes(1);
  });
});
