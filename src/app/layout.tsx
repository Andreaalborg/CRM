import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kundedata - Skjemaer, Leads & E-post Automasjon",
  description: "Samle inn leads med elegante skjemaer, automatiser e-poster og administrer kundedata - alt på ett sted.",
  keywords: ["skjema", "leads", "kundedata", "e-post automasjon", "CRM"],
  authors: [{ name: "Kundedata" }],
  openGraph: {
    title: "Kundedata - Skjemaer, Leads & E-post Automasjon",
    description: "Samle inn leads med elegante skjemaer, automatiser e-poster og administrer kundedata.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
