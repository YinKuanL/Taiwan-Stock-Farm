import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import AppRuntime from "@/components/AppRuntime";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#244f37",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Farm Market Battle｜台股農場戰場",
    description: "把台股多空情緒變成會呼吸的農場，並快速查詢上市公司行情與最新財報摘要。",
    manifest: "/manifest.webmanifest",
    applicationName: "Farm Market Battle",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "農場戰場" },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/favicon.svg" },
    openGraph: {
      title: "Farm Market Battle｜台股農場戰場",
      description: "看懂台股多空農場，查詢上市公司行情與最新財報摘要。",
      locale: "zh_TW",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1672, height: 939, alt: "Farm Market Battle 台股農場戰場" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Farm Market Battle｜台股農場戰場",
      description: "看懂台股多空農場，查詢上市公司行情與最新財報摘要。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body><AppRuntime />{children}</body>
    </html>
  );
}
