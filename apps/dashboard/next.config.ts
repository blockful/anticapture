/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: ["@anticapture/client"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    domains: ["euc.li", "ensdata.net", "static.ricmoo.com", "www.ricmoo.com"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    return [
      // better-auth self-generates browser-facing URLs (magic-link emails,
      // OAuth redirect_uri) as {origin}/api/auth/* — its baseURL can't carry
      // the /api/user proxy prefix without breaking inbound route matching on
      // the service. Rewrite those hits into the cookie-relaying User API
      // proxy so the links actually resolve.
      {
        source: "/api/auth/:path*",
        destination: "/api/user/api/auth/:path*",
      },
    ];
  },
  async redirects() {
    const redirects = [];

    if (process.env.NEXT_PUBLIC_ANTICAPTURE_TELEGRAM_BOT) {
      redirects.push({
        source: "/telegram",
        destination: process.env.NEXT_PUBLIC_ANTICAPTURE_TELEGRAM_BOT,
        permanent: false,
      });
    }
    if (process.env.NEXT_PUBLIC_ANTICAPTURE_SLACK_BOT) {
      redirects.push({
        source: "/slack",
        destination: process.env.NEXT_PUBLIC_ANTICAPTURE_SLACK_BOT,
        permanent: false,
      });
    }

    // Permanent redirects: governance → proposals
    redirects.push(
      {
        source: "/:daoId/governance",
        destination: "/:daoId/proposals",
        permanent: true,
      },
      {
        source: "/:daoId/governance/proposal/:proposalId",
        destination: "/:daoId/proposals/:proposalId",
        permanent: true,
      },
    );

    return redirects;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
  serverExternalPackages: ["pino-pretty"],
  turbopack: {
    resolveAlias: {
      // @shutter-network/shutter-crypto's Go wasm_exec glue requires "fs" at
      // runtime only outside the browser; stub it so Turbopack can bundle the
      // package for client components.
      fs: { browser: "./empty-module.ts" },
    },
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@rainbow-me/rainbowkit",
      "date-fns",
    ],
  },
};

export default nextConfig;
