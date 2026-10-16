import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Personal Life OS",
    short_name: "Life OS",
    description: "Tasks, calendar, habits, goals, notes and money in one private workspace.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f8f6f1",
    theme_color: "#2f7d79",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
