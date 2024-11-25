/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/midweave' : '',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_REPOSITORY: process.env.NEXT_PUBLIC_REPOSITORY,
    NEXT_PUBLIC_MW_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MW_ACCESS_TOKEN,
    NEXT_PUBLIC_BRANCH: process.env.NEXT_PUBLIC_BRANCH,
  },
}

module.exports = nextConfig 