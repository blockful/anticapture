/** @type {import('next').NextConfig} */
const nextConfig = {
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
