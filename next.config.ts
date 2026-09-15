import type { NextConfig } from 'next';
import { SITE } from './src/lib/constants';

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
  {
    key: 'X-Download-Options',
    value: 'noopen',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "connect-src 'self' https://api.open-meteo.com https://api.resend.com https://api.web3forms.com https://formsubmit.co https://wa.me https://api.whatsapp.com https://www.google-analytics.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com",
      "frame-src 'self' https://maps.google.com https://www.google.com",
      "base-uri 'self'",
      "form-action 'self' https://formsubmit.co https://wa.me",
      ...(isProd ? ["frame-ancestors 'none'", 'upgrade-insecure-requests'] : []),
      "object-src 'none'",
    ].join('; '),
  },
  ...(isProd
    ? [
        { key: 'X-Frame-Options', value: 'DENY' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    qualities: [75, 78, 88, 90, 92],
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
  },
  async redirects() {
    return [
      // Unificar en www (dominio que debe aparecer en Google)
      {
        source: '/:path*',
        has: [{ type: 'host', value: SITE.domain }],
        destination: `https://${SITE.publicHost}/:path*`,
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
