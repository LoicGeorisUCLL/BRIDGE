import withPWA from 'next-pwa';
import { i18n } from './next-i18next.config.js';

const nextConfig = {
  reactStrictMode: true,

  i18n,

  images: {
    formats: ['image/webp', 'image/avif'],
  },

  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

export default withPWA({
  ...nextConfig,
  pwa: {
    dest: 'public',
    register: true,  // registers service worker automatically
    skipWaiting: true, // activate new SW immediately
    disable: process.env.NODE_ENV === 'development', // disable in dev mode
  },
});
