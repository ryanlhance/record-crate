import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

// One clean grotesque, used at heavy weights for graphic impact.
const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
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
      className={`${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
