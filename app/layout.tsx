import type { Metadata } from "next";
import { AppProvider } from "@/components/AppProvider";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Security+ SY0-701 MCQ Generator",
  description: "AI-powered synthesis question generator for CompTIA Security+ SY0-701",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans`}>
        <AppProvider>{children}</AppProvider>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
