/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'export',
  // For GitHub Pages deployment to repository subfolder
  // Set to '/deafauth' for https://deafauth.github.io/deafauth/
  // Set to '' for custom domain or org-level pages
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Enable trailing slashes for static export compatibility
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
