import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
