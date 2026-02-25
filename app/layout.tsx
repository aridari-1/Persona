import type { Metadata } from "next";
import "./globals.css";
import AppProvider from "@/app/providers/AppProvider";

export const metadata: Metadata = {
  title: "Persona",
  description: "AI-generated social media platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen bg-black text-white antialiased">
        {/* Global Providers (Context, Theme, etc.) */}
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}