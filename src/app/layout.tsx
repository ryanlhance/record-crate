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

export const metadata: Metadata = {
  title: "Ryan's Records",
  description: "Flip through Ryan's record shelf and pick something to play.",
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
