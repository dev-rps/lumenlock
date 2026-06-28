import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Security headers for production
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.stellar.org https://stellar.expert wss:",
              "img-src 'self' data: blob: https:",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Required for Stellar SDK (Buffer polyfill)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve("buffer/"),
      stream: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
