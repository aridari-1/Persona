"use client";

import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-black text-white">

      {/* TOP BAR */}
      <header className="flex-shrink-0 border-b border-[#1a1a1a]">
        <TopBar />
      </header>

      {/* SCROLL AREA */}
      <main className="flex-1 overflow-y-auto ios-scroll">
        {children}
      </main>

      {/* BOTTOM NAV */}
      <footer className="flex-shrink-0 border-t border-[#1a1a1a]">
        <BottomNav />
      </footer>

    </div>
  );
} 