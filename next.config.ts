import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "fimgs.net" },                // Fragrantica images
      { protocol: "https", hostname: "fimgs.fragrantica.com" },    // Fragrantica images alternate
      { protocol: "https", hostname: "upload.wikimedia.org" },     // Wikipedia
      { protocol: "https", hostname: "fmtqqpnhnexwmgpeaidb.supabase.co" }, // Your Supabase Storage
      { protocol: "https", hostname: "images.unsplash.com" },      // Unsplash
      { protocol: "https", hostname: "plus.unsplash.com" },      // Unsplash
      { protocol: "https", hostname: "i.postimg.cc" },             // PostImage
      { protocol: "https", hostname: "s6.imgcdn.dev" },            // ImgCDN
      { protocol: "https", hostname: "www.perfumemaster.com" },    // PerfumeMaster images
    ],
  },
};

export default nextConfig;
