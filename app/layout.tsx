import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "Podcast Asset Studio",
  description:
    "One-page podcast and video asset generator for YouTube, Spotify, X, and TikTok.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={geistSans.className}>{children}</body>
    </html>
  );
}
