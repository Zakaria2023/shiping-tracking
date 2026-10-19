import { Metadata } from "next";
import localFont from "next/font/local";
import { ReactNode } from "react";
import { Shell } from "@/components/layout/shell";
import "./globals.css";

// Self-hosted variable fonts: one file covers every weight, and a build never
// waits on a download from Google.
const hankenGrotesk = localFont({
  src: "../fonts/hanken-grotesk-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-hanken",
  display: "swap",
});

const jetBrainsMono = localFont({
  src: "../fonts/jetbrains-mono-latin.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

type Props = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: "Shipment Tracking",
  description: "Where every shipment is, by origin and destination",
};

// Runs before first paint so a dark page never flashes light: the saved
// choice, else the system setting. use-theme.ts reads and changes it after.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

// Always render against live data — never a build-time static snapshot.
export const dynamic = "force-dynamic";

const RootLayout = ({ children }: Props) => (
  <html
    lang="en"
    className={`h-full antialiased ${hankenGrotesk.variable} ${jetBrainsMono.variable}`}
    // The theme script sets data-theme before React hydrates.
    suppressHydrationWarning
  >
    <head>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
    </head>
    <body className="min-h-full font-sans text-ink">
      <Shell>{children}</Shell>
    </body>
  </html>
);

export default RootLayout;
