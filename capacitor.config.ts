import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.englishflow.app",
  appName: "EnglishFlow",
  webDir: "out",
  server: {
    url: "http://localhost:3000",
    cleartext: true,
  },
};

export default config;
