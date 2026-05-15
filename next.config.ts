import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type errors are checked locally; allow build to complete on Vercel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
