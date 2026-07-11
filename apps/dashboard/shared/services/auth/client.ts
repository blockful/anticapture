"use client";

import { magicLinkClient, siweClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// The User API lives behind the same-origin /api/user proxy, and the service
// mounts better-auth at /api/auth — so the full client prefix is
// /api/user/api/auth. (When baseURL carries a path, better-auth uses it as-is
// and does NOT append its default basePath.) The SSR placeholder origin is
// never used for a real request — auth calls run client-side only.
const origin =
  typeof window === "undefined" ? "http://localhost" : window.location.origin;

export const authClient = createAuthClient({
  baseURL: `${origin}/api/user/api/auth`,
  plugins: [siweClient(), magicLinkClient()],
});

export const { useSession, signOut } = authClient;
