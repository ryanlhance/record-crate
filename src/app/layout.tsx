import type { Metadata } from "next";
import { Bricolage_Grotesque, Permanent_Marker } from "next/font/google";
import "./globals.css";

// Bricolage Grotesque: characterful, editorial — has personality at heavy
// weights without the generic geometric-sans look.
const sans = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Permanent Marker: hand-drawn marker, single weight. Scoped to `.font-marker`
// (see globals.css) so it only ever paints the Sharpie genre labels and the
// "by vibe" stamps — never body or UI.
const marker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marker",
  display: "swap",
});

// Base path on GitHub Pages (e.g. "/record-crate"); empty in dev. Icon URLs must
// include it so browsers resolve them under the subpath.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SITE_URL = "https://ryanlhance.github.io/record-crate";
const TITLE = "Ryan's Records";
const DESCRIPTION =
  "Flip through Ryan's record shelf and pick something to play.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/`,
    images: [
      {
        url: `${SITE_URL}/og.png`,
        width: 1200,
        height: 630,
        alt: "Ryan's Collection — hand-painted record-shelf sign",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og.png`],
  },
  icons: {
    icon: [
      { url: `${BASE_PATH}/icon-32.png`, sizes: "32x32", type: "image/png" },
      { url: `${BASE_PATH}/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${BASE_PATH}/icon-512.png`, sizes: "512x512", type: "image/png" },
    ],
    apple: [
      {
        url: `${BASE_PATH}/apple-touch-icon.png`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${marker.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
