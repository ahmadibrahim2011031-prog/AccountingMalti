/** @type {import('next').NextConfig} */
const nextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: true,
  },

  experimental: {
    optimizeCss: false,
    instrumentationHook: true,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = false;
      config.optimization.runtimeChunk = false;

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false
    };

    return config;
  },

  // Redirects for domain handling
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'www.maltiaccounting.com',
          },
        ],
        destination: '/pages/landing',
        permanent: false,
      },
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'maltiaccounting.com',
          },
        ],
        destination: '/pages/landing',
        permanent: false,
      },
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'admin.maltiaccounting.com',
          },
        ],
        destination: '/pages/login',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
