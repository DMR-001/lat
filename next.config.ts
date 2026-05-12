import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['expresscheckout-nodejs'],
  // SDK reads process.cwd()/package.json via fs.readFileSync at load time.
  // Vercel's file tracer misses this, so force package.json into every bundle.
  outputFileTracingIncludes: {
    '**': ['./package.json'],
  },
};

export default nextConfig;
