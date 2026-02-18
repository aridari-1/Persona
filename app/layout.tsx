import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Persona",
  description: "AI Generated Identity Social Network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white overflow-x-hidden`}
      >
        {/* 📱 Mobile Container */}
        <div className="max-w-md mx-auto min-h-dvh flex flex-col relative">

          {/* 🔝 Top Navigation */}
          <TopNav />

          {/* 📄 Main Scrollable Content */}
          <main className="flex-1 overflow-y-auto pt-16 pb-20">
            {children}
          </main>

          {/* 🔻 Bottom Navigation */}
          <BottomNav />

        </div>
      </body>
    </html>
  );
}
