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

// Always render against live data — never a build-time static snapshot.
export const dynamic = "force-dynamic";

const RootLayout = ({ children }: Props) => (
  <html
    lang="en"
    className={`h-full antialiased ${hankenGrotesk.variable} ${jetBrainsMono.variable}`}
  >
    <body className="min-h-full font-sans text-ink">
      <Shell>{children}</Shell>
    </body>
  </html>
);

export default RootLayout;
