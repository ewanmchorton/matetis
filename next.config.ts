import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // Открыть локальный сервер с телефона в той же Wi-Fi-сети.
  allowedDevOrigins: ["127.0.0.1", "*.local", "192.168.*.*", "10.*.*.*", "172.*.*.*"],
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? "/matetis" : "",
    // На GitHub Pages нет сервера: проверки входа там пропускаются (см. src/shared/auth/session.ts).
    NEXT_PUBLIC_STATIC_PROTOTYPE: isGithubPages ? "true" : "",
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
