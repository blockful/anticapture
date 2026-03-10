import pino from "pino";

export type Logger = pino.Logger;

export function createLogger(service: string): Logger {
  const isDev = process.env.NODE_ENV !== "production";

  return pino({
    name: service,
    level: process.env.LOG_LEVEL ?? "info",
    ...(isDev && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      },
    }),
  });
}
