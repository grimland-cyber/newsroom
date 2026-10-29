import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles so this runs before the static "/" page, which would
      // otherwise ignore ?category= and serve the unfiltered list.
      beforeFiles: [
        {
          source: "/",
          has: [
            {
              type: "query",
              key: "category",
              value: "(?<category>[A-Za-z0-9_-]{1,80})",
            },
          ],
          destination: "/feed/:category",
        },
      ],
    };
  },
};

export default nextConfig;
