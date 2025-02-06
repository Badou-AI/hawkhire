/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ghtlgaalkzakttyioeve.supabase.co',
        pathname: '/storage/v1/object/public/company-assets/**',
      },
    ],
  },
}

module.exports = nextConfig 