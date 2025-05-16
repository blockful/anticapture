/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["euc.li"],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty');
    return config;
  },
};

export default nextConfig;
