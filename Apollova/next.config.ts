/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['node-cron'],
  experimental: {
    middlewareClientMaxBodySize: '500mb',
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/../uploads/:path*",
      },
    ];
  },
};

export default nextConfig;