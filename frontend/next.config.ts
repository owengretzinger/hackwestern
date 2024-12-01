import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "cdn1.suno.ai",
      "encrypted-tbn0.gstatic.com",
      "oaidalleapiprodscus.blob.core.windows.net",
    ],
  },
};

export default nextConfig;
