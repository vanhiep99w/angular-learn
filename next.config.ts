import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
};

export default withMDX(config);
