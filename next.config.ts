import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Session/cookie-driven app — avoid aggressive static caching of authenticated routes
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
