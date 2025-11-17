import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite todas las imágenes HTTPS (eventos de múltiples fuentes)
      },
    ],
  },
};

export default nextConfig;
