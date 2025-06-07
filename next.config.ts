// next.config.ts
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
<<<<<<< HEAD
    '*.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev',
    '*.cloudworkstations.dev',
=======
    '*.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev', // Added based on logs
    '*.cloudworkstations.dev', // Added based on logs
>>>>>>> a70ea8f (a)
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
<<<<<<< HEAD
    const handlebarsLibIndexRule = /node_modules\/handlebars\/lib\/index\.js$/;

    config.module ??= {};
    config.module.noParse ??= [];
=======
    // Rule to tell Webpack not to parse Handlebars' CJS internals.
    const handlebarsLibIndexRule = /node_modules\/handlebars\/lib\/index\.js$/;
    
    config.module = config.module || {};
    config.module.noParse = config.module.noParse || [];
>>>>>>> a70ea8f (a)

    // Ensure noParse is an array and add the rule if not already present
    if (Array.isArray(config.module.noParse)) {
<<<<<<< HEAD
      config.module.noParse.push(handlebarsLibIndexRule);
    } else {
      config.module.noParse = [handlebarsLibIndexRule];
    }

    if (options.isServer) {
      config.resolve ??= {};
      config.resolve.alias ??= {};
      if (typeof config.resolve.alias === 'object' && !Array.isArray(config.resolve.alias)) {
        config.resolve.alias.handlebars = 'handlebars/dist/handlebars.js';
      }
=======
      if (!config.module.noParse.some(r => r.toString() === handlebarsLibIndexRule.toString())) {
        config.module.noParse.push(handlebarsLibIndexRule);
      }
    } else { 
      // If it was a single RegExp, convert to array and add
      config.module.noParse = [config.module.noParse, handlebarsLibIndexRule];
    }

    // Alias Handlebars to its UMD distribution for better Webpack compatibility
    // for both client and server bundles.
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    if (typeof config.resolve.alias === 'object' && !Array.isArray(config.resolve.alias)) {
      config.resolve.alias.handlebars = 'handlebars/dist/handlebars.js';
>>>>>>> a70ea8f (a)
    }

    return config;
  },
};

export default nextConfig;
