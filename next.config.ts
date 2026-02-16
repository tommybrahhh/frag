import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: "https", hostname: "fimgs.net", pathname: "**" },                // Fragrantica images
      { protocol: "https", hostname: "fimgs.fragrantica.com", pathname: "**" },    // Fragrantica images alternate
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "**" },     // Wikipedia
      { protocol: "https", hostname: "fmtqqpnhnexwmgpeaidb.supabase.co", pathname: "**" }, // Your Supabase Storage
      { protocol: "https", hostname: "images.unsplash.com", pathname: "**" },      // Unsplash
      { protocol: "https", hostname: "plus.unsplash.com", pathname: "**" },      // Unsplash
      { protocol: "https", hostname: "i.postimg.cc", pathname: "**" },             // PostImage
      { protocol: "https", hostname: "s6.imgcdn.dev", pathname: "**" },            // ImgCDN
      { protocol: "https", hostname: "imgur.com", pathname: "**" },                // Imgur
      { protocol: "https", hostname: "i.imgur.com", pathname: "**" },              // Imgur alternate
      { protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/**" }, // GitHub Raw with leading slash
      { protocol: "https", hostname: "user-images.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "www.perfumemaster.com", pathname: "**" },    // PerfumeMaster images
    ],
  },
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
          // Optional: Add Cache-Control to prevent stale sitemaps
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;