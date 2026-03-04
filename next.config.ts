import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "brqxbqfarhuyasgvuyyx.supabase.co",
      },
    ],
  },
};

export default nextConfig;