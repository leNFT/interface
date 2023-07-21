/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  reactStrictMode: true,
  output: "export",
  distDir: "_static",
  images: {
    loader: "custom",
    unoptimized: true,
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
