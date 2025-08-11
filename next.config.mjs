/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fceaelwbsvllwgbqaeck.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/auth/confirm',
        destination: '/auth/confirm', 
      },
    ]
  },
}

export default nextConfig
