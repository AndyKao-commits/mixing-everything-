/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Keep binary path intact for yt-dlp wrapper
  serverExternalPackages: ['youtube-dl-exec'],
}

export default nextConfig
