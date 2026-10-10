/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
      },
      {
        protocol: 'https',
        hostname: 'archive.org',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  compress: true,
  productionBrowserSourceMaps: false,
  swcMinify: true,
};

module.exports = nextConfig;
