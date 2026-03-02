import * as Sentry from "@sentry/node";
// Ensure to call this before requiring any other modules!
Sentry.init({
  dsn: process.env.API_SENTRY_DSN,
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  enableLogs: true,
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});
