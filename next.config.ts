import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serverless SQLite demo mode copies data/demo.db to /tmp on cold start (see src/lib/db.ts);
  // make sure the snapshot is bundled with every server function.
  outputFileTracingIncludes: {
    "/**/*": ["./data/demo.db"],
  },
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
