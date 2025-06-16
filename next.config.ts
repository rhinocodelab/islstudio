import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  // Add API route configuration
  async rewrites() {
    return [
      {
        source: '/api/serve-published-video',
        destination: '/api/serve-published-video',
      },
    ];
  },
};

export default nextConfig;
