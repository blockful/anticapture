import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createLogger } from "@anticapture/observability";

import { startKeeperLoop } from "./keeper-loop";

const silentLogger = createLogger("keeper-loop-test");
silentLogger.level = "silent";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("startKeeperLoop", () => {
  it("ticks immediately and then on every interval", async () => {
    const tick = vi.fn().mockResolvedValue(undefined);

    const loop = startKeeperLoop({ tick }, 1000, silentLogger);
    await vi.advanceTimersByTimeAsync(0);
    expect(tick).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2000);
    expect(tick).toHaveBeenCalledTimes(3);

    loop.stop();
  });

  it("skips a scheduled tick while the previous one is still running", async () => {
    let release!: () => void;
    const tick = vi
      .fn()
      .mockImplementation(
        () => new Promise<void>((resolve) => (release = resolve)),
      );

    const loop = startKeeperLoop({ tick }, 1000, silentLogger);
    await vi.advanceTimersByTimeAsync(0);
    // first tick hangs across two intervals
    await vi.advanceTimersByTimeAsync(2500);
    expect(tick).toHaveBeenCalledTimes(1);

    release();
    await vi.advanceTimersByTimeAsync(1000);
    expect(tick).toHaveBeenCalledTimes(2);

    loop.stop();
  });

  it("keeps ticking after a tick rejects", async () => {
    const tick = vi
      .fn()
      .mockRejectedValueOnce(new Error("rpc down"))
      .mockResolvedValue(undefined);

    const loop = startKeeperLoop({ tick }, 1000, silentLogger);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);

    expect(tick).toHaveBeenCalledTimes(2);

    loop.stop();
  });

  it("stops ticking after stop()", async () => {
    const tick = vi.fn().mockResolvedValue(undefined);

    const loop = startKeeperLoop({ tick }, 1000, silentLogger);
    await vi.advanceTimersByTimeAsync(0);
    loop.stop();
    await vi.advanceTimersByTimeAsync(5000);

    expect(tick).toHaveBeenCalledTimes(1);
  });
});
