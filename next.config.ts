import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // The Storage bucket accepts images up to 5 MB. Multipart form data adds
      // a small amount of overhead beyond the file itself.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
