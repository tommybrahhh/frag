import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ 1. Move reactCompiler to experimental
  experimental: {
    reactCompiler: true,
  },

  // ❌ 2. Removed 'turbopack' key (it is not a valid NextConfig option)

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

  // ✅ 3. Correct headers for Sitemap (Matches my requirements)
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