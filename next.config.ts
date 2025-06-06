
import type {NextConfig} from 'next';
import type { Configuration as WebpackConfiguration } from 'webpack';

const nextConfig: NextConfig = {
  /* config options here */
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
      }
    ],
  },
  allowedDevOrigins: [
    'local-origin.dev', 
    '*.local-origin.dev', 
    '*.cluster-etsqrqvqyvd4erxx7qq32imrjk.cloudworkstations.dev',
    // Adding a more general one just in case the cluster ID also changes, though less likely.
    '*.cloudworkstations.dev' 
  ],
  webpack: (
    config: WebpackConfiguration,
    options: { buildId: string; dev: boolean; isServer: boolean; defaultLoaders: any; nextRuntime?: string; totalPages?: number }
  ) => {
    // Handlebars uses `require.extensions` which is not supported by Webpack.
    // Adding it to `noParse` tells Webpack not to parse this file for Node.js specific constructs.
    const handlebarsLibIndexRule = /node_modules\/handlebars\/lib\/index\.js$/;
    
    if (!config.module) {
      config.module = {};
    }
    if (!config.module.noParse) {
      config.module.noParse = [];
    }

    if (Array.isArray(config.module.noParse)) {
      config.module.noParse.push(handlebarsLibIndexRule);
    } else if (config.module.noParse instanceof RegExp) {
      config.module.noParse = [config.module.noParse, handlebarsLibIndexRule];
    }
    // If it was some other non-array, non-RegExp type, it gets replaced by an array with the rule.
    // This is unlikely for default Next.js configs but handles edge cases.
    else {
        config.module.noParse = [handlebarsLibIndexRule];
    }

    // Alias 'handlebars' to its UMD distribution for the server build
    // to prevent issues with internal CJS requires in the bundled output.
    if (options.isServer) {
      if (!config.resolve) {
        config.resolve = {};
      }
      if (!config.resolve.alias) {
        config.resolve.alias = {};
      }
      // Ensure alias is an object, which is the common case. 
      // Next.js might use an array of functions for aliases in some advanced scenarios,
      // but for simple string-to-string aliases, object form is typical.
      if (typeof config.resolve.alias === 'object' && !Array.isArray(config.resolve.alias)) {
        config.resolve.alias.handlebars = 'handlebars/dist/handlebars.js';
      }
    }

    return config;
  },
};

export default nextConfig;
