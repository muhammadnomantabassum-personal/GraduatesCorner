import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Graduates Corner",
    short_name: "Graduates Corner",
    description: "Find PhD positions, master's thesis opportunities, and graduate trainee programs worldwide.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7faff",
    theme_color: "#1a73e8",
    icons: [
      { src: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
