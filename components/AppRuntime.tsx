"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useRouter } from "next/navigation";

export default function AppRuntime() {
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    const openDeepLink = (url: string | undefined) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        if (parsed.host === "battle" || parsed.pathname === "/battle") router.push("/battle");
      } catch {
        // Ignore malformed external links.
      }
    };
    void App.getLaunchUrl().then((result) => !disposed && openDeepLink(result?.url));
    void App.addListener("appUrlOpen", ({ url }) => openDeepLink(url)).then((handle) => {
      removeListener = () => handle.remove();
    });
    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, [router]);

  return null;
}
