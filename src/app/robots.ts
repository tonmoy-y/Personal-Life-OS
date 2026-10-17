import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy"],
      disallow: ["/api/", "/auth/", "/onboarding", "/dashboard", "/today", "/tasks", "/calendar", "/habits", "/goals", "/projects", "/notes", "/finance", "/analytics", "/settings", "/help"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
