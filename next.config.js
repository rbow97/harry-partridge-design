/** @type {import('next').NextConfig} */
const nextConfig = {
  // the homepage is the projects index now; the old /projects grid is gone
  async redirects() {
    return [{ source: "/projects", destination: "/", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        port: "",
      },
    ],
  },
};

module.exports = nextConfig;
