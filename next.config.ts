import type { NextConfig } from "next";

// On GitHub Pages this site is served from https://<user>.github.io/record-crate/,
// so production builds need a base path. Dev stays at the root.
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/record-crate" : "";

const nextConfig: NextConfig = {
  output: "export", // static HTML/CSS/JS in ./out — what GitHub Pages serves
  basePath,
  trailingSlash: true, // emit /route/index.html so Pages serves clean URLs
  images: { unoptimized: true },
  env: {
    // Exposed to client code so raw <img> src paths can be prefixed too.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
