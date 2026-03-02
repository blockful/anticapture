import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  // Propagate traces to the API so frontend → API traces are linked
  tracePropagationTargets: [
    "localhost",
    /^https?:\/\/.*anticapture/,
    process.env.NEXT_PUBLIC_BASE_URL ?? "",
  ],
  sendDefaultPii: true,
});
