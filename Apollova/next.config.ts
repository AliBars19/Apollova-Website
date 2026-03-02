/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['node-cron'],
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