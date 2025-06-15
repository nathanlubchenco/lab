/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle WebGL for Plotly
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

module.exports = nextConfig;