/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@radix-ui/react-label', '@radix-ui/react-checkbox', 'lucide-react'],
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
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/components': path.resolve(__dirname, 'components'),
      '@/hooks': path.resolve(__dirname, 'hooks'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/types': path.resolve(__dirname, 'types')
    };
    return config;
  }
};

module.exports = nextConfig; 