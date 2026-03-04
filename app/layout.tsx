import type { Metadata } from "next";
import "./globals.css";
import AppProvider from "@/app/providers/AppProvider";

export const metadata: Metadata = {
  title: "Persona",
  description: "AI-generated social media platform",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen bg-black text-white antialiased overflow-hidden">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}