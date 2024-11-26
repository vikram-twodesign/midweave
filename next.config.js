/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/midweave' : '',
  trailingSlash: true,
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  }
}

module.exports = nextConfig 