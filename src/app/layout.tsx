import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Noto_Sans_Bengali } from "next/font/google";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/NavigationProgress";
import { site } from "@/config/site";
import "./globals.css";

const heading = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const body = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.shortName}` },
  description: site.description,
  applicationName: site.shortName,
  openGraph: {
    type: "website",
    locale: "bn_BD",
    siteName: site.name,
    title: site.name,
    description: site.description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: site.name }],
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.description, images: ["/og-image.png"] },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#168447",
  width: "device-width",
  initialScale: 1,
};

// Content comes from the database and is edited live from /admin.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${heading.variable} ${body.variable}`}>
      <body className="min-h-dvh">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
