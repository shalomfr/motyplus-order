import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://motyplus-2hvb.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
