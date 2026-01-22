/** @type {import('next').NextConfig} */
const nextConfig = {
  // Externalize sql.js to prevent bundling issues with WebAssembly
  serverExternalPackages: ['sql.js'],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark sql.js as external to prevent bundling issues
      config.externals = [...(config.externals || []), 'sql.js'];
    }
    return config;
  },
};

export default nextConfig;
