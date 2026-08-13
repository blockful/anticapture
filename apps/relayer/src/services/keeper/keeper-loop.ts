import type { Logger } from "@anticapture/observability";

export interface Tickable {
  tick(): Promise<void>;
}

export interface KeeperLoop {
  stop(): void;
}

/**
 * Runs the keeper on a fixed interval: one tick immediately on start, then
 * one per interval. A tick that outlives the interval causes the overlapping
 * runs to be skipped rather than piled up (one in-flight tick at a time).
 */
export function startKeeperLoop(
  keeper: Tickable,
  intervalMs: number,
  logger: Logger,
): KeeperLoop {
  let running = false;

  const runOnce = async () => {
    if (running) return;
    running = true;
    try {
      await keeper.tick();
    } catch (err) {
      logger.error({ err }, "keeper: tick failed");
    } finally {
      running = false;
    }
  };

  // fire-and-forget: errors are handled inside runOnce
  void runOnce();
  const timer = setInterval(() => void runOnce(), intervalMs);

  return {
    stop() {
      clearInterval(timer);
    },
  };
}
