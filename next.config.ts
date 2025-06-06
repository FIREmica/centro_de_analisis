import type { NextConfig } from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    'local-origin.dev',
    '*.local-origin.dev',
    '*.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev',
    '*.cloudworkstations.dev',
  ],
  webpack: (
    config: WebpackConfiguration,
    options: {
      buildId: string;
      dev: boolean;
      isServer: boolean;
      defaultLoaders: any;
      nextRuntime?: string;
      totalPages?: number;
    }
  ) => {
    const handlebarsLibIndexRule = /node_modules\/handlebars\/lib\/index\.js$/;

    if (!config.module) config.module = {};
    if (!config.module.noParse) config.module.noParse = [];

    if (Array.isArray(config.module.noParse)) {
      config.module.noParse.push(handlebarsLibIndexRule);
    } else if (config.module.noParse instanceof RegExp) {
      config.module.noParse = [config.module.noParse, handlebarsLibIndexRule];
    } else {
      config.module.noParse = [handlebarsLibIndexRule];
    }

    if (options.isServer) {
      config.resolve ??= {};
      config.resolve.alias ??= {};
      if (typeof config.resolve.alias === 'object' && !Array.isArray(config.resolve.alias)) {
        config.resolve.alias.handlebars = 'handlebars/dist/handlebars.js';
      }
    }

    return config;
  },
};

export default nextConfig;
