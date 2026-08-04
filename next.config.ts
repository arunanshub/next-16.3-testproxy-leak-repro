import type { NextConfig } from "next";

// testProxy turns on only when NEXT_PUBLIC_E2E_MODE is set. This matches the
// real app. testProxy routes server-side fetch through the test proxy.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    testProxy: process.env.NEXT_PUBLIC_E2E_MODE ? true : undefined,
  },
};

export default nextConfig;
