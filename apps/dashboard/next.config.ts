/** @type {import('next').NextConfig} */
const nextConfig = {
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
    return [
      {
        source: "/telegram",
        destination: process.env.NEXT_PUBLIC_ANTICAPTURE_TELEGRAM_BOT!,
        permanent: false,
      },
      {
        source: "/slack",
        destination: process.env.NEXT_PUBLIC_ANTICAPTURE_SLACK_BOT!,
        permanent: false,
      },
    ];
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
