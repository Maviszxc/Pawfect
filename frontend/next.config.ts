// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Add WebSocket support and CORS headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Fix WebSocket and other Node.js module issues on client side
    if (isServer) {
      config.externals.push({
        'ws': 'commonjs ws',
      });
    }
    return config;
  },
  // Explicitly list external packages
  serverExternalPackages: ['ws'],

  
  // Configure Turbopack to resolve workspace root warning
  turbopack: {
    root: "C:\\Users\\gunda\\Documents\\App Dev\\From-Github-(Latest)\\Pawfect\\frontend"
  },
};

export default nextConfig;
