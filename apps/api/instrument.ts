import * as Sentry from "@sentry/node";
// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: "https://8a917989ab9b8dae994c7439660cd008@o4510976083296256.ingest.de.sentry.io/4510976098435152",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  enableLogs: true,
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});
