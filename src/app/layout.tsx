import type { Metadata, Viewport } from "next";
import { Geist, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import AttributionCapture from "@/components/AttributionCapture";
import PostHogProvider from "@/components/PostHogProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans-global",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HelloChina — Your AI Guide for Navigating China",
  description:
    "AI-powered navigation, restaurant discovery, and travel help — designed for foreigners visiting China.",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HelloChina",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${dmSans.variable} font-sans antialiased`}>
        <div className="landscape-block" aria-hidden="true">
          <div className="landscape-block-icon">📱</div>
          <div className="landscape-block-title">Please rotate your device</div>
          <div className="landscape-block-sub">This app works best in portrait mode</div>
        </div>
        <ErrorBoundary>
          <PostHogProvider>
            <ServiceWorkerRegistration />
            <AttributionCapture />
            {children}
          </PostHogProvider>
        </ErrorBoundary>
        <Analytics />
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "vwjux8vnum");`}
        </Script>
      </body>
    </html>
  );
}
