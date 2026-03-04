"use client";

import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white">

      {/* Top */}
      <div className="flex-shrink-0">
        <TopBar />
      </div>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto ios-scroll">
        {children}
      </main>

      {/* Bottom */}
      <div className="flex-shrink-0">
        <BottomNav />
      </div>

    </div>
  );
}