/** @type {import('next').NextConfig} */
const nextConfig = {
  exportTrailingSlash: true,
  exportPathMap: function () {
    return {
      "/": { page: "/" },
    };
  },
  reactStrictMode: true,
  images: {
    loader: "custom",
  },
};

module.exports = nextConfig;
