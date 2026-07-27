export interface ClosableServer {
  close(callback: (error?: Error) => void): void;
}

export interface UsageFlusher {
  stop(): Promise<void>;
}

/** Stops accepting requests, drains active requests, then flushes their usage. */
export const drainServerAndFlushUsage = async (
  server: ClosableServer,
  usage: UsageFlusher,
): Promise<void> => {
  let closeFailure: unknown;
  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  } catch (error) {
    closeFailure = error;
  }

  await usage.stop();
  if (closeFailure) throw closeFailure;
};
