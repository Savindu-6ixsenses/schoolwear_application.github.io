/** @type {import('next').NextConfig} */
const nextConfig = {
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
