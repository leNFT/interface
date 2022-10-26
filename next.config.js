/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  images: {
    loader: "custom",
  },
  remotePatterns: [
    {
      protocol: "https",
      hostname: "**",
      port: "",
    },
  ],
};

module.exports = nextConfig;
