import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@anlp/shared-types', 'd3-force', 'd3-dispatch', 'd3-quadtree', 'd3-timer'],
};

export default nextConfig;
