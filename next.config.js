/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    // Handle Supabase Edge Functions
    config.module.rules.push({
      test: /supabase\/functions/,
      use: 'null-loader'
    });

    // Ignore specific modules that cause issues
    config.resolve.alias = {
      ...config.resolve.alias,
      'https://deno.land/std@0.168.0/http/server.ts': false,
      '@supabase/supabase-js/dist/module/lib/fetch': false,
    };

    return config;
  },
}

module.exports = nextConfig; 