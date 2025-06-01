import type { NextConfig } from "next";
import { i18n } from './next-i18next.config.js';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,

    // PWA Configuration
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

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },





  // // Internationalization
  i18n,



};



export default nextConfig;
