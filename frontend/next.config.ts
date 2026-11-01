import type { NextConfig } from "next";

const backendUrl = (process.env.BACKEND_URL ?? "http://127.0.0.1:8001").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  // Proxy API calls through Next.js so the browser never needs cross-origin
  // access to the FastAPI server. Override BACKEND_URL for a deployed API.
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
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
