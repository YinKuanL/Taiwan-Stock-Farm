"use client";

import { useEffect } from "react";
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
    const connectNativeBridge = async () => {
      const [{ App }, { Capacitor }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/core"),
      ]);
      if (disposed || !Capacitor.isNativePlatform()) return;
      const launchResult = await App.getLaunchUrl();
      if (!disposed) openDeepLink(launchResult?.url);
      const handle = await App.addListener("appUrlOpen", ({ url }) => openDeepLink(url));
      if (disposed) await handle.remove();
      else removeListener = () => handle.remove();
    };
    void connectNativeBridge().catch(() => undefined);
    return () => {
      disposed = true;
      void removeListener?.();
    };
  }, [router]);

  return null;
}
