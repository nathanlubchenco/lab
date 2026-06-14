import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the static games hub/pages at clean directory URLs
  // (e.g. /games and /games/duel) by mapping them to their index.html.
  // Scoped to /games only — existing app routes are unaffected.
  async rewrites() {
    return [
      { source: "/games", destination: "/games/index.html" },
      { source: "/games/:game", destination: "/games/:game/index.html" },
    ];
  },
};

export default nextConfig;
