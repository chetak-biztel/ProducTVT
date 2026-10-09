import type { MetadataRoute } from "next";

/** Makes the app installable ("Add to Home Screen") and open full-screen like a native app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProducTVT — Team Plans & Projects",
    short_name: "ProducTVT",
    description: "Weekly action plans, todos, and project management for the team.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7fb",
    theme_color: "#f5f7fb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My Weekly Plan", url: "/plan" },
      { name: "Todos", url: "/todos" },
    ],
  };
}
