/** @type {import('next').NextConfig} */
const nextConfig = {
  exportTrailingSlash: true,
  reactStrictMode: true,
  images: {
    loader: "custom",
  },
};

module.exports = nextConfig;
