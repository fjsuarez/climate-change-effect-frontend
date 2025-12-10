import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // webpack: (config) => {
  //   config.module = config.module || {};
  //   config.module.rules = config.module.rules || [];
    
  //   config.module.rules.push({
  //     test: /\.mjs$/,
  //     include: /node_modules/,
  //     type: "javascript/auto",
  //   });

  //   return config;
  // },
  // transpilePackages: ['react-map-gl', 'mapbox-gl'],
};

export default nextConfig;
