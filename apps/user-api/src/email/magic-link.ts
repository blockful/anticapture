import { Resend } from "resend";

import type { SendMagicLink } from "@/auth";

/**
 * The verify endpoint consumes its single-use token on the first GET, and
 * mail pipelines routinely prefetch links (AV scanners, client previews,
 * click-tracking) — a direct link would arrive already burned when the user
 * clicks. The email therefore links the dashboard's interstitial page, which
 * triggers the verify from the browser (JS/user gesture) that prefetchers
 * don't execute.
 */
export const magicLinkLandingUrl = (verifyUrl: string): string => {
  const verify = new URL(verifyUrl);
  const landing = new URL("/auth/magic-link", verify.origin);
  landing.search = verify.search; // token + callbackURL
  return landing.toString();
};

/**
 * Builds a magic-link email sender backed by Resend, or returns undefined when
 * no API key is configured — which leaves magic-link sign-in disabled (the
 * service stays SIWE-only). Mirrors the dashboard's existing Resend usage.
 */
export const createMagicLinkSender = (
  apiKey: string | undefined,
  from: string,
): SendMagicLink | undefined => {
  if (!apiKey) return undefined;
  const resend = new Resend(apiKey);

  return async ({ email, url }) => {
    const landingUrl = magicLinkLandingUrl(url);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Sign in to Anticapture",
      // Inline-styled with the dashboard's dark-theme tokens (globals.css):
      // background #09090b, surface #18181b, border #3f3f46, text #fafafa /
      // #a1a1aa / #71717a, brand #ec762e — square corners like rounded-base.
      html: `
        <div style="background-color: #09090b; padding: 40px 16px; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;">
          <div style="max-width: 400px; margin: 0 auto; background-color: #18181b; border: 1px solid #3f3f46; padding: 32px 24px; text-align: center;">
            <p style="margin: 0 0 24px; font-family: 'Roboto Mono', ui-monospace, monospace; font-size: 13px; line-height: 20px; letter-spacing: 0.08em; text-transform: uppercase; color: #ec762e;">Anticapture</p>
            <h2 style="margin: 0 0 4px; font-size: 16px; line-height: 24px; font-weight: 600; color: #fafafa;">Sign in to Anticapture</h2>
            <p style="margin: 0 0 24px; font-size: 14px; line-height: 20px; color: #a1a1aa;">Click the button below to sign in. This link expires shortly and can be used once.</p>
            <a href="${landingUrl}" style="display: inline-block; background-color: #ec762e; color: #09090b; padding: 12px 24px; font-size: 14px; line-height: 20px; font-weight: 500; text-decoration: none;">Sign in</a>
            <p style="margin: 24px 0 0; font-size: 12px; line-height: 16px; color: #71717a;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });
    // Surface delivery failures so the verify endpoint returns 5xx instead of
    // silently reporting success.
    if (error) throw new Error(`magic-link email failed: ${error.message}`);
  };
};
