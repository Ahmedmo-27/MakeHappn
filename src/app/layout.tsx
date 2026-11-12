import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter_Tight, JetBrains_Mono, Syne } from "next/font/google";
import { Interactions } from "@/components/fx/interactions";
import "./globals.css";

const display = Syne({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-display" });
const sans = Inter_Tight({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "makehappn", template: "%s · makehappn" },
  description: "The operating system behind MakeHappn: from first inquiry to final applause.",
};

export const viewport: Viewport = {
  themeColor: "#0d0d0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <Suspense fallback={null}>
          <Interactions />
        </Suspense>
      </body>
    </html>
  );
}
