import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPU Explorer — how a GPU works, animated",
  description:
    "An interactive, animated tour of every component inside a GPU and how they work together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
