/** @type {import('next').NextConfig} */
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

export default nextConfig;
