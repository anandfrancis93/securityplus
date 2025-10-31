import type { Metadata } from "next";
import { AppProvider } from "@/components/AppProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "@carbon/styles/css/styles.css";
import "../styles/design-tokens.css";

export const metadata: Metadata = {
  title: {
    default: "SecurityPlus AI | Master CompTIA Security+ SY0-701 with AI-Powered Learning",
    template: "%s | SecurityPlus AI"
  },
  description: "AI-powered adaptive learning platform for CompTIA Security+ SY0-701 certification. Unlimited AI-generated questions, IRT analytics, FSRS spaced repetition, and comprehensive coverage of all 5 domains. Free forever.",
  manifest: '/manifest.json',
  themeColor: '#0f0f0f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SecurityPlus AI',
  },
  applicationName: 'SecurityPlus AI',
  keywords: [
    "CompTIA Security+",
    "SY0-701",
    "Security+ exam",
    "cybersecurity certification",
    "AI-powered learning",
    "adaptive learning",
    "spaced repetition",
    "IRT analytics",
    "exam preparation",
    "cybersecurity training",
    "FSRS algorithm",
    "Security+ practice questions",
    "CompTIA certification"
  ],
  authors: [{ name: "SecurityPlus AI" }],
  creator: "SecurityPlus AI",
  publisher: "SecurityPlus AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://securityplusai.com",
    title: "SecurityPlus AI | Master CompTIA Security+ SY0-701",
    description: "Master CompTIA Security+ SY0-701 with AI-powered adaptive learning. Unlimited questions, IRT analytics, and FSRS spaced repetition. Free forever.",
    siteName: "SecurityPlus AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SecurityPlus AI - AI-Powered Security+ Learning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SecurityPlus AI | Master CompTIA Security+ SY0-701",
    description: "AI-powered adaptive learning for CompTIA Security+ certification. Free forever.",
    images: ["/og-image.png"],
    creator: "@SecurityPlusAI",
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  verification: {
    // Add your verification tokens here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  category: 'education',
  alternates: {
    canonical: "https://securityplusai.com",
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
        <ErrorBoundary>
          <AppProvider>{children}</AppProvider>
        </ErrorBoundary>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
