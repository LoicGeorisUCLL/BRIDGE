import { Html, Head, Main, NextScript } from "next/document";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BRIDGE - Belgian Administration Guide',
  description: 'Your personal guide through Belgian administrative processes for seasonal workers',
  manifest: '/manifest.json',
  themeColor: '#1e40af',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function Document() {
  return (
    <Html lang="en">
       <Head>
        {/* PWA stuff */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        {/* viewport kan hier ook, maar Next voegt standaard al viewport toe in pages/_app.tsx */}
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
