import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from "@/components/ui/sonner"
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin HyrePro",
  description: "Admin panel for the HyrePro platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>

      </body>
      <Toaster position="top-center" />
    </html>
  );
}