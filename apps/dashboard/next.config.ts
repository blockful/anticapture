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
        destination: "https://t.me/anticapturebot",
        permanent: false,
      },
      {
        source: "/slack",
        destination:
          "https://subscription-server-production.up.railway.app/slack/install",
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
};

export default nextConfig;
