import type { CapacitorConfig } from "@capacitor/cli";

const remoteUrl = process.env.CAPACITOR_SERVER_URL?.trim();
const config: CapacitorConfig = {
  appId: "com.kuan.farmmarketbattle",
  appName: "Farm Market Battle",
  webDir: "build/client",
  ios: {
    contentInset: "automatic",
    scheme: "FarmMarketBattle",
  },
  ...(remoteUrl ? {
    server: {
      url: remoteUrl,
      cleartext: remoteUrl.startsWith("http://"),
      allowNavigation: [new URL(remoteUrl).hostname],
    },
  } : {}),
};

export default config;
