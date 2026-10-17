import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Only the genuinely public pages; everything else is behind a login. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
