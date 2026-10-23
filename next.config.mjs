/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '1mb' },
  },
  eslint: {
    // يتخطى ESLint أثناء بناء الإنتاج فقط.
    // أخطاء TypeScript تبقى تُفحص وتوقف البناء عند الحاجة.
    ignoreDuringBuilds: true,
  },
};