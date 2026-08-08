import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/Providers";
import { Analytics } from "@/components/seo/Analytics";
import { NavigationProgress } from "@/components/seo/NavigationProgress";
import {
  OrganizationSchema,
  SoftwareApplicationSchema,
  WebApplicationSchema,
} from "@/components/seo/StructuredData";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/constants";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "600", "700", "800"],
  preload: true,
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400"],
  preload: false,
});

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Free Online PDF Editor | Edit, Merge, Split, Convert PDFs`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "pdf editor",
    "edit pdf online",
    "free pdf editor",
    "merge pdf",
    "split pdf",
    "compress pdf",
    "pdf to word",
    "word to pdf",
    "sign pdf",
    "pdf watermark",
    "online pdf tools",
    "pdf converter",
    "add text to pdf",
    "pdf annotation",
    "free pdf tools",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "productivity",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Free Online PDF Editor with 15+ Tools`,
    description:
      "Edit, merge, split, compress and convert PDFs online for free. No signup required. All processing in your browser.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Free Online PDF Editor`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Free Online PDF Editor`,
    description:
      "15+ PDF tools, 100% free, 100% private. Files processed in your browser.",
    images: ["/twitter-card.png"],
    creator: "@pdfforge",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(yandexVerification ? { yandex: yandexVerification } : {}),
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF7ED" },
    { media: "(prefers-color-scheme: dark)", color: "#1C0A00" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${mono.variable} font-sans min-h-screen flex flex-col`}
      >
        <OrganizationSchema />
        <WebApplicationSchema />
        <SoftwareApplicationSchema />
        <Providers>
          <NavigationProgress />
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
