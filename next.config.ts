import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore log files so they don't trigger HMR loops
      config.watchOptions = {
        ignored: ['**/nextjs_mongo.log'],
      };
    }
    return config;
  },
  /* config options here */
  reactStrictMode: false,
  devIndicators: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*', '@tanstack/react-table', '@tanstack/react-query', 'recharts'],
  },
  transpilePackages: ['yjs', '@hocuspocus/server', '@hocuspocus/transformer'],
  poweredByHeader: false,
};

export default nextConfig;
