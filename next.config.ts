import type { NextConfig } from "next";

// VillageOS is a mobile-first PWA served as one full-stack Next.js app (App
// Router). The manifest + service worker are static assets under /public; the
// Reality Ledger and all domain logic live in Route Handlers / Server Actions.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The worker and app share the same DATABASE_URL/REDIS_URL/S3_* env wired by
  // Terraform (infra/terraform/local-docker). Nothing secret is inlined here.
  serverExternalPackages: ["postgres", "drizzle-orm"],
};

export default nextConfig;
