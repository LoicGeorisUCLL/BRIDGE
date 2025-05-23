# Deployment Guide

This guide covers different ways to deploy your Bridge app to production.

## Quick Deploy to Vercel (Recommended)

Vercel provides the easiest deployment for Next.js applications:

### 1. Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# Follow the prompts to configure your deployment
```

### 2. Using GitHub Integration

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign up
3. Click "New Project" and import your GitHub repository
4. Vercel will automatically detect Next.js and configure the build
5. Click "Deploy" - your app will be live in minutes!

## Alternative Deployment Options

### Netlify

1. Build the static export:
```bash
# Add to next.config.js
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

npm run build
```

2. Upload the `out` folder to Netlify or connect your Git repository

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t bridge-app .
docker run -p 3000:3000 bridge-app
```

## Environment Configuration

### Environment Variables

Create `.env.local` for local development:

```bash
# App Configuration
NEXT_PUBLIC_APP_NAME="Bridge"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Analytics (optional)
NEXT_PUBLIC_GA_ID="your-google-analytics-id"
```

### Production Environment Variables

Set these in your deployment platform:

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://yourdomain.com`

## PWA Configuration

### Service Worker

The app is PWA-ready. To enable full PWA features, you can add a service worker:

1. Install `next-pwa`:
```bash
npm install next-pwa
```

2. Update `next.config.js`:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // your existing config
})
```

### PWA Icons

Add these icon files to your `public` folder:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)
- `apple-touch-icon.png` (180x180 pixels)
- `favicon.ico`

## Performance Optimization

### Image Optimization

Place optimized images in the `public` folder and use Next.js Image component:

```typescript
import Image from 'next/image'

<Image
  src="/bridge-logo.png"
  alt="Bridge Logo"
  width={96}
  height={96}
  priority
/>
```

### Bundle Analysis

Analyze your bundle size:

```bash
npm install --save-dev @next/bundle-analyzer

# Add to package.json scripts:
"analyze": "ANALYZE=true next build"

npm run analyze
```

## Monitoring & Analytics

### Error Monitoring

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
```

### Performance Monitoring

Use Vercel Analytics or Google Analytics:

```typescript
// pages/_app.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

## Security Considerations

### Content Security Policy

Add CSP headers in `next.config.js`:

```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### HTTPS Only

Ensure your deployment platform serves over HTTPS:
- Vercel: Automatic HTTPS
- Netlify: Automatic HTTPS
- Custom domains: Configure SSL certificates

## Domain Configuration

### Custom Domain

1. **Vercel**: Go to Project Settings → Domains
2. **Netlify**: Site Settings → Domain Management
3. **Cloudflare**: Add DNS records pointing to your deployment

### DNS Configuration

```
Type: CNAME
Name: www
Value: your-deployment-url.vercel.app

Type: A
Name: @
Value: deployment-ip-address
```

## Troubleshooting

### Common Build Issues

1. **TypeScript Errors**: Fix all TypeScript errors before deployment
2. **Missing Dependencies**: Ensure all dependencies are in `package.json`
3. **Environment Variables**: Check all required env vars are set

### Mobile Testing

Test on actual devices:
- iOS Safari
- Android Chrome
- Various screen sizes
- PWA installation process

### Performance Issues

1. **Large Bundle Size**: Use bundle analyzer to identify large dependencies
2. **Slow Loading**: Optimize images and enable compression
3. **Memory Issues**: Check for memory leaks in React components

## Maintenance

### Updates

Keep dependencies updated:
```bash
npm update
npm audit fix
```

### Monitoring

Set up monitoring for:
- Uptime monitoring
- Performance metrics
- Error rates
- User analytics

### Backups

- Code: Git repository with regular commits
- Data: Local storage means no server-side backup needed
- Configuration: Document environment variables and settings