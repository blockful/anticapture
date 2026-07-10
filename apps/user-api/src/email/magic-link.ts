import { Resend } from "resend";

import type { SendMagicLink } from "@/auth";

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
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: "Sign in to Anticapture",
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="font-size: 18px;">Sign in to Anticapture</h2>
          <p style="color: #555;">Click the button below to sign in. This link expires shortly and can be used once.</p>
          <p style="margin: 24px 0;">
            <a href="${url}" style="background: #E66AE9; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">Sign in</a>
          </p>
          <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    // Surface delivery failures so the verify endpoint returns 5xx instead of
    // silently reporting success.
    if (error) throw new Error(`magic-link email failed: ${error.message}`);
  };
};
