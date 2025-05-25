/** @type {import('next').NextConfig} */

import BundlerAnalyzer from "@next/bundle-analyzer";

const nextConfig = {
  images: {
    domains: ["euc.li"],
  },
  webpack: (config: { externals: string[] }) => {
    config.externals.push("pino-pretty");
    return config;
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
};

const withBundleAnalyzer = BundlerAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
