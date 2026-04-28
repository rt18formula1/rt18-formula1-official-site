import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/providers/language-provider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://rt18-formula1-official-site.vercel.app"
  ),
  title: "rt18_formula1",
  description:
    "rt18_formula1 Official Website - Exclusive Formula 1 fan art, illustrations, and the latest F1 news. Discover visual content celebrating motorsport.",
  keywords: [
    "Formula 1",
    "F1 fan art",
    "F1 illustrations",
    "F1 news",
    "motorsport art",
    "F1 artwork",
    "racing illustrations",
    "rt18_formula1",
  ],
  openGraph: {
    title: "rt18_formula1 - Exclusive Formula1 Fan Art & Illustrations",
    description:
      "Discover exclusibe Formula1 fan art, illustrations, and the latest F1 news, rt18_formula1.",
    url: "/",
    siteName: "rt18_formula1",
    locale: "en_US",
    type: "website",
    images: ["/favicon.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "rt18_formula1 Official Website",
    description: "F1 illustrations and latest Formula 1 race news by rt18_formula1.",
    images: ["/favicon.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "rt18_f1",
  },
  icons: {
    icon: [{ url: "/favicon.png" }],
    apple: [{ url: "/favicon.png" }],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-black">
        <LanguageProvider>{children}</LanguageProvider>
        <Analytics />
      </body>
    </html>
  );
}
