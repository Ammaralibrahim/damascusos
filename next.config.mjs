/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: '1mb' } },
};