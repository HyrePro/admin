import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Hyriki",
  description: "Admin panel for the Hyriki platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-[100dvh]">
  <body className={`${inter.variable} antialiased h-[100dvh] overflow-x-hidden`}>
    {children}
  </body>
</html>

  );
}