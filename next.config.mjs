/** @type {import('next').NextConfig} */

const nextConfig = {
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { }) => {
 
    return config;
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [100, 200, 300, 400],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vkgkhipasxqxitwlktwz.supabase.co',
        pathname: '/storage/v1/**'
      },
      {
        protocol: 'https',
        hostname: 'ylx-aff.advertica-cdn.com',
        pathname: '/pub/**'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**'
      }
    ]
  },
  headers: async () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In development, disable caching
    if (isDevelopment) {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ],
        },
      ];
    }

    // Production caching rules
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate'
          }
        ],
      },
      {
        // Cache static assets for 1 month
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400'
          }
        ],
      },
      {
        // Cache Next.js static assets for 1 year
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        // Cache images for 1 month with stale-while-revalidate
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400'
          }
        ],
      }
    ];
  },
};

export default nextConfig;
