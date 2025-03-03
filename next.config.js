/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove this line
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true }, // Keep this if you’re not optimizing images
};

module.exports = nextConfig;