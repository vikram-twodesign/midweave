/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/midweave',
  images: {
    unoptimized: true,
  },
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig 