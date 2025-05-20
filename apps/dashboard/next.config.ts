/** @type {import('next').NextConfig} */
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

export default nextConfig;
