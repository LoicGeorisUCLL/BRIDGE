import type { NextConfig } from "next";
import { i18n } from './next-i18next.config.js';


const nextConfig: NextConfig = {
  reactStrictMode: true,
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

export default nextConfig;
