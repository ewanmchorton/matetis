import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? "/matetis" : "",
  },
  ...(isGithubPages
    ? {
        output: "export",
        basePath: "/matetis",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
