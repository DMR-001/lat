import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['expresscheckout-nodejs'],
};

export default nextConfig;
