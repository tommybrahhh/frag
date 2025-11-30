import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "fimgs.net" },                // Fragrantica images
      { protocol: "https", hostname: "upload.wikimedia.org" },     // Wikipedia
      { protocol: "https", hostname: "images.sephora.com" },       // Sephora
      { protocol: "https", hostname: "www.sephora.com" },          // Sephora Alt
      { protocol: "https", hostname: "static.zara.net" },          // Zara
      { protocol: "https", hostname: "fmtqqpnhnexwmgpeaidb.supabase.co" }, // Your Supabase Storage
      { protocol: "https", hostname: "media.neimanmarcus.com" },   // Neiman Marcus
      { protocol: "https", hostname: "tomford.com" },              // Tom Ford
      { protocol: "https", hostname: "louisvuitton.com" },         // LV
      { protocol: "https", hostname: "armaf.com" },                // Armaf
      { protocol: "https", hostname: "xerjoff.com" },              // Xerjoff
      { protocol: "https", hostname: "target.scene7.com" },        // Target
    ],
  },
};

export default nextConfig;
