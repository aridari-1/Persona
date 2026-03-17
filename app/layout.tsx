import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppProvider from "@/app/providers/AppProvider";

export const metadata: Metadata = {
  title: "Persona",
  description: "AI-generated social media platform",

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",
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