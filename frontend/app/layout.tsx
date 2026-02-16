import type { Metadata, Viewport } from "next";
import { Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BackendStatus } from "@/components/BackendStatus";
import ErrorBoundary from "@/components/ErrorBoundary";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FindMyJob - Job Search Aggregator",
  description: "Discover your dream job with powerful search aggregation. Scrape jobs from LinkedIn, Indeed, Glassdoor and more.",
  keywords: ["job search", "job scraper", "LinkedIn jobs", "Indeed jobs", "career", "employment"],
  authors: [{ name: "FindMyJob" }],
  icons: {
    icon: "/favicon.ico",
  },
  // Accessibility metadata
  other: {
    "format-detection": "telephone=no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to font sources for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Focus visible polyfill behavior via CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Hide focus styles for mouse users */
          body.using-mouse *:focus { outline: none; }
        `}} />
      </head>
      <body
        className={`${outfit.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {/* Skip to main content link for keyboard users */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal-500 focus:text-white focus:rounded-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <ErrorBoundary>
          <BackendStatus>
            {children}
          </BackendStatus>
        </ErrorBoundary>
        {/* Script to detect mouse vs keyboard navigation */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('mousedown', function() { document.body.classList.add('using-mouse'); });
          document.addEventListener('keydown', function(e) { if (e.key === 'Tab') document.body.classList.remove('using-mouse'); });
        `}} />
      </body>
    </html>
  );
}
