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
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
