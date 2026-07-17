import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Farm Market Battle｜台股開心農場戰場",
    short_name: "農場戰場",
    description: "把台股多空與市場情緒變成一座會呼吸的原創農場戰場。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f4f2e9",
    theme_color: "#244f37",
    categories: ["finance", "entertainment"],
    lang: "zh-Hant-TW",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "進入農場戰場", short_name: "戰場", url: "/battle", icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }] },
      { name: "查詢股票與財報", short_name: "查股票", url: "/#research", icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }] },
    ],
  };
}
