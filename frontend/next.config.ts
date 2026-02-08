import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${backendUrl}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
