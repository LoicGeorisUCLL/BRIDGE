import type { NextConfig } from "next";
import { i18n } from './next-i18next.config.js';
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Optional: Serve your manifest with cache control
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },

  images: {
    formats: ['image/webp', 'image/avif'],
  },

  i18n,
};

export default withPWA(nextConfig);
