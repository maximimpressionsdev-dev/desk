import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Next 16.3 + Vercel's build adapter breaks when standalone is set
  // (ENOENT .next/next-server.js.nft.json). Keep standalone for Docker.
  output: process.env.VERCEL ? undefined : "standalone",
}

export default nextConfig
