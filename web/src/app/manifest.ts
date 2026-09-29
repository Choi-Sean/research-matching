import type { MetadataRoute } from "next";

// Lets phones "Add to Home Screen" and open Labora like an app (no browser bar). start_url "/" is sent to the visitor's language by proxy.ts.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Labora — Find the professor who fits you",
    short_name: "Labora",
    description:
      "Discover researchers from the world's scholarly record, understand their work in plain language, and get AI-matched with labs that fit your skills and working style.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#faf9f6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
