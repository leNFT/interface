/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    loader: "custom",
  },
};

module.exports = nextConfig;
