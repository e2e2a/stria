import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  devIndicators: false,
  // experimental: {
  //   optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@tanstack/react-table', '@tanstack/react-query', 'recharts'],
  // },
  allowedDevOrigins: ['localhost:3000', 'responsibilities-protest-realistic-listening.trycloudflare.com'],
  transpilePackages: ['yjs', '@hocuspocus/server', '@hocuspocus/transformer'],
  poweredByHeader: false,
};

export default nextConfig;
