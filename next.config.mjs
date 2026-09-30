/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1'

const nextConfig = {
  reactStrictMode: true,
  ...(isVercel
    ? {
        // This Vercel project is configured for static `out/` (see historical deploys).
        // API is served by /api serverless functions alongside the export.
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),
}

export default nextConfig
