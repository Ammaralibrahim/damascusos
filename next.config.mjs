/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '1mb' },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};