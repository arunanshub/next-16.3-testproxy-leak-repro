import type { NextConfig } from "next";

// testProxy is enabled only in E2E mode, exactly like the real app: it is the
// switch that routes server-side fetch() through the test proxy so
// next/experimental/testmode can intercept it.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    testProxy: process.env.NEXT_PUBLIC_E2E_MODE ? true : undefined,
  },
};

export default nextConfig;
