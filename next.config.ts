import type {NextConfig} from 'next';

const isAnalyze = process.env.ANALYZE === 'true';

const nextConfig: NextConfig = {
  /* config options here */
  
  // Configuration React
  reactStrictMode: true,
  
  // Configuration de développement et production
  experimental: {
    optimizeCss: true,
    turbo: {
      rules: {},
    },
  },
  
  // Bundle size et performance
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Quality gates enforcement
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Bundle analysis
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle size analysis
    if (isAnalyze && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: './bundle-analyzer-report.html',
        })
      );
    }

    // Bundle size limits
    config.performance = {
      maxAssetSize: 300000, // 300KB per asset
      maxEntrypointSize: 300000, // 300KB per entrypoint
      hints: 'error', // Fail build on size violations
    };

    // Tree shaking optimization
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };

    return config;
  },
  images: {
    // Configuration pour l'optimisation des images
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 an en secondes
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.firebaseapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Configuration des headers pour le cache
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|webp|avif|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
