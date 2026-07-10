"use client";

import { siweClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// The User API lives behind the same-origin /api/user proxy; better-auth's
// default basePath (/api/auth) then resolves to /api/user/api/auth. The SSR
// placeholder origin is never used for a real request — auth calls run
// client-side only.
const origin =
  typeof window === "undefined" ? "http://localhost" : window.location.origin;

export const authClient = createAuthClient({
  baseURL: `${origin}/api/user`,
  plugins: [siweClient()],
});

export const { useSession, signOut } = authClient;
