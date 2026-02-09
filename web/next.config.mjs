/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@kubernetes/client-node'],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), '@kubernetes/client-node'];
    }
    return config;
  },
};

export default nextConfig;
