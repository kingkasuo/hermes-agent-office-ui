/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  trailingSlash: false,
  allowedDevOrigins: ['192.168.1.64', 'localhost:3000'],
};

module.exports = nextConfig;