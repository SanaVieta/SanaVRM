import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    agentFeedback: true,
  },
  reactCompiler: true,
  // TypeORM loads its driver (`pg`) with a runtime require, which breaks when bundled.
  // `pg` is imported from the data source so the standalone trace keeps it external
  // and follows its dependencies.
  serverExternalPackages: ["typeorm", "pg"],
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
