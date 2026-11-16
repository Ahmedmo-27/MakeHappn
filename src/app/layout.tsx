import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Instrument_Serif, JetBrains_Mono, Oooh_Baby } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import { Interactions } from "@/components/fx/interactions";
import "./globals.css";

/**
 * 2025 type, with free stand-ins until the licensed files are added.
 * General Sans is the UI face (this file).
 * Instrument Serif stands in for Editorial New: display headlines and the italic "make".
 * Oooh Baby stands in for Awesome Ways: one script accent.
 * Drop Editorial New and Awesome Ways into src/fonts and point these loaders at them.
 * JetBrains Mono stays for IDs and money. It is not a brand face.
 */
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
});

const sans = localFont({
  src: [
    { path: "../fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/GeneralSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const script = Oooh_Baby({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "makehappn", template: "%s · makehappn" },
  description: "The operating system behind MakeHappn: from first inquiry to final applause.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

const themeBoot = `(function(){try{var t=localStorage.getItem("mh-theme");if(t!=="light"&&t!=="dark")t="dark";var root=document.documentElement;root.dataset.theme=t;root.style.colorScheme=t;var color=t==="light"?"#f6f4f2":"#000000";var themeColor=document.querySelector('meta[name="theme-color"]');if(themeColor)themeColor.setAttribute("content",color);var scheme=document.querySelector('meta[name="color-scheme"]');if(scheme)scheme.setAttribute("content",t);}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${script.variable} ${mono.variable}`}
    >
      <body>
        <Script id="mh-theme" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        {children}
        <Suspense fallback={null}>
          <Interactions />
        </Suspense>
      </body>
    </html>
  );
}
