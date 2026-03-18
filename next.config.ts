import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: "https://motyplus-2hvb.onrender.com",
  },
};

export default nextConfig;
