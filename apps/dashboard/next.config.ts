/** @type {import('next').NextConfig} */

const resolveApiUrls = () => {
  const prId = process.env.VERCEL_GIT_PULL_REQUEST_ID;
  const vercelEnv = process.env.VERCEL_ENV; // 'production' | 'preview' | 'development'

  if (vercelEnv === "preview" && prId) {
    return {
      NEXT_PUBLIC_BASE_URL: `https://api-gateway-anticapture-pr-${prId}.up.railway.app/graphql`,
      NEXT_PUBLIC_GATEFUL_URL: `https://gateful-anticapture-pr-${prId}.up.railway.app`,
    };
  }

  // Production and local dev: fall through to values already set in Vercel / .env
  return {};
};

const nextConfig = {
  env: resolveApiUrls(),
  transpilePackages: ["@anticapture/graphql-client", "@anticapture/client"],
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
      {
        source: "/:daoId/governance/offchain-proposal/:proposalId",
        destination: "/:daoId/proposals/:proposalId?proposalType=offchain",
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
