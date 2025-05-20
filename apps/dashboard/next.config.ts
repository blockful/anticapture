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
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  },
};

const withBundleAnalyzer = BundlerAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
