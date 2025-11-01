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
    default: "AI Learning Platform | Adaptive Education with AI-Powered Content",
    template: "%s | AI Learning Platform"
  },
  description: "Adaptive learning platform powered by AI with intelligent quizzes, IRT analytics, FSRS spaced repetition, and personalized study paths. Currently featuring Cybersecurity (CompTIA Security+ SY0-701). Free forever.",
  manifest: '/manifest.json',
  themeColor: '#0f0f0f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AI Learning',
  },
  applicationName: 'AI Learning Platform',
  keywords: [
    "AI learning platform",
    "adaptive learning",
    "AI-powered education",
    "spaced repetition",
    "IRT analytics",
    "personalized learning",
    "FSRS algorithm",
    "CompTIA Security+",
    "SY0-701",
    "cybersecurity certification",
    "exam preparation",
    "AI-generated questions",
    "intelligent tutoring"
  ],
  authors: [{ name: "AI Learning Platform" }],
  creator: "AI Learning Platform",
  publisher: "AI Learning Platform",
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
    title: "AI Learning Platform | Adaptive Education",
    description: "Adaptive learning platform powered by AI with intelligent quizzes, IRT analytics, and FSRS spaced repetition. Currently featuring Cybersecurity. Free forever.",
    siteName: "AI Learning Platform",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Learning Platform - Adaptive Education Powered by AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Learning Platform | Adaptive Education",
    description: "AI-powered adaptive learning with intelligent quizzes and personalized study paths. Free forever.",
    images: ["/og-image.png"],
    creator: "@AILearningApp",
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
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#0f0f0f" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans`}>
        <ErrorBoundary>
          <AppProvider>{children}</AppProvider>
        </ErrorBoundary>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
