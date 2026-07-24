import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@edunet/database", "@edunet/ai", "@edunet/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
