/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_GITHUB_TOKEN: process.env.NEXT_PUBLIC_GITHUB_TOKEN,
    NEXT_PUBLIC_REPOSITORY: process.env.NEXT_PUBLIC_REPOSITORY || 'vikram-twodesign/midweave',
    NEXT_PUBLIC_BRANCH: process.env.NEXT_PUBLIC_BRANCH || 'main',
  },
  basePath: process.env.NODE_ENV === 'production' ? '/midweave' : '',
}

module.exports = nextConfig 