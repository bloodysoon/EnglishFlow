import type { CapacitorConfig } from "@capacitor/cli";

const platform = process.env.CAP_PLATFORM;
const environment = process.env.CAP_ENV;

const localUrl =
  platform === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

const config: CapacitorConfig = {
  appId: "com.englishflow.app",
  appName: "EnglishFlow",
  webDir: "out",

  plugins: {
    // The web app sets viewport-fit=cover (src/app/layout.tsx); telling Android
    // up front avoids a padded first frame that jumps to edge-to-edge.
    SystemBars: { initialViewportFitValueHint: "cover" },
  },

  ...(environment === "development"
    ? {
        server: {
          url: localUrl,
          cleartext: true,
        },
      }
    : environment === "remote-testing"
      ? {
          server: {
            url: "https://english-flow-wheat.vercel.app",
          },
        }
      : {}),
};

export default config;
