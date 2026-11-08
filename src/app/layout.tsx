import type { Metadata } from "next";
import { Outfit, Sacramento } from "next/font/google";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-figtree" });
const script = Sacramento({ subsets: ["latin"], weight: "400", variable: "--font-script" });

export const metadata: Metadata = {
  title: { default: "makehappn", template: "%s · makehappn" },
  description: "The work behind emotionally-driven experiences: crews, tasks, and the reason every status changes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
