import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  weight: ["600", "700"],
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
    <html lang="nb" suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
