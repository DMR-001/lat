import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['expresscheckout-nodejs'],
  experimental: {
    outputFileTracingIncludes: {
      // SDK reads process.cwd()/package.json at class instantiation time.
      // Vercel's file tracer doesn't detect this static fs.readFileSync call,
      // so we explicitly include package.json in every serverless function bundle.
      '**': ['./package.json'],
    },
  },
};

export default nextConfig;
