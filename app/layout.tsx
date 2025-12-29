import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Communication Studio",
  description: "A suite of tools to refine your speaking and writing.",
  icons: {
    icon: [
      { url: "/voice-insights-icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/voice-insights-icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/voice-insights-icon-32.png",
    apple: "/voice-insights-icon-180.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
