/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ghtlgaalkzakttyioeve.supabase.co',
        pathname: '/storage/v1/object/public/company-assets/**',
      },
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
  // Only ignore specific directories that contain third-party components
  eslint: {
    // Only ignore the UI components directory which contains shadcn components
    dirs: ['app', 'lib', 'hooks', 'components', '!components/ui'],
  },
  typescript: {
    // We don't want to ignore all type errors, just handle them properly
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig 