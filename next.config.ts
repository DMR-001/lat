import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['expresscheckout-nodejs'],
};

export default nextConfig;
