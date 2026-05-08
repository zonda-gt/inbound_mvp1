import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.chinapal.app",
  appName: "ChinaPal",
  webDir: "out",
  server: {
    url: "https://app.hellochina.chat",
    cleartext: false,
    androidScheme: "https",
    errorPath: "index.html",
  },
  ios: {
    contentInset: "automatic",
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#ffffff",
  },
  backgroundColor: "#ffffff",
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#ffffff",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
