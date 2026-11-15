import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets a phone on the same Wi-Fi load the dev server. Dev only; ignored in production.
  allowedDevOrigins: ["192.168.1.193"],
};

export default nextConfig;