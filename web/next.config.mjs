/** @type {import('next').NextConfig} */
const nextConfig = {
  // Externalize sql.js to prevent bundling issues with WebAssembly
  experimental: {
    serverComponentsExternalPackages: ['sql.js', '@kubernetes/client-node'],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark packages as external to prevent bundling issues
      config.externals = [...(config.externals || []), 'sql.js', '@kubernetes/client-node'];
    }
    return config;
  },
};

export default nextConfig;
