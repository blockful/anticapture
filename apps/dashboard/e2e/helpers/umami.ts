import type { Page } from "playwright/test";

/**
 * Keep automated traffic out of Umami analytics. Production builds (including
 * Vercel previews and the live app that synthetic monitoring probes) load the
 * Umami script unconditionally, so every run would otherwise register as a
 * real visitor.
 *
 * Belt and suspenders: abort every request to the Umami cloud host (the
 * script itself and any /api/send beacons) AND pre-seed Umami's official
 * localStorage opt-out flag, so nothing leaks even if the script is served
 * from a different path or the browser cache.
 */
export async function blockUmami(page: Page): Promise<void> {
  await page.route("https://cloud.umami.is/**", (route) => route.abort());
  await page.addInitScript(() => {
    window.localStorage.setItem("umami.disabled", "1");
  });
}
