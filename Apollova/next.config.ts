/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['node-cron'],
  experimental: {
    middlewareClientMaxBodySize: '500mb',
  },
};

export default nextConfig;