import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // HTTPS configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Explicitly enable Turbopack for Next.js 16+
  turbopack: {},
  // Enable advanced optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  // Optimize images
  images: {
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fnrkxvvygersqubojfon.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Only use webpack config for non-Turbopack builds
  webpack: (config, { dev, isServer }) => {
    // Replace moment.js with dayjs if moment is used
    if (!dev && !isServer) {
      config.resolve.alias.moment = 'dayjs';
    }
    
    return config;
  },
};

export default nextConfig;