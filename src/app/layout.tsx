import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./consistency-hotfix.css";
import "./client-ui.css";
import "./interaction-p0.css";
import "./agent-workspace.css";
import "./today-dashboard.css";
import "./agent-conversation.css";
import { PerformanceObserverClient } from "@/components/performance-observer";
import { publicSite } from "@/components/public-site/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicSite.origin),
  title: {
    default: "Gro — Your dedicated Growth Agent",
    template: "%s | Gro",
  },
  description:
    "Gro brings verified website, Google and analytics signals into one supervised Growth Agent workspace.",
  icons: { icon: "/gro-icon.svg", apple: "/gro-apple-icon" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PerformanceObserverClient />
        {children}
      </body>
    </html>
  );
}
