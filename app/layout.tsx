import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppProvider from "@/app/providers/AppProvider";

export const metadata: Metadata = {
  title: "Persona",
  description: "AI-generated social media platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-black text-white antialiased overscroll-none">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}