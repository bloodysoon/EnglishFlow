import type { CapacitorConfig } from "@capacitor/cli";

const platform = process.env.CAP_PLATFORM;

const config: CapacitorConfig = {
  appId: "com.englishflow.app",
  appName: "EnglishFlow",
  webDir: "out",
  ...(platform === "ios" || platform === "android"
    ? {
        server: {
          url:
            platform === "android"
              ? "http://10.0.2.2:3000"
              : "http://localhost:3000",
          cleartext: true,
        },
      }
    : {}),
};

export default config;
