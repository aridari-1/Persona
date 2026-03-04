"use client";

import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] bg-black text-white overflow-hidden">
      <div className="relative h-full max-w-md mx-auto">

        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 z-50 safe-top">
          <div className="max-w-md mx-auto">
            <TopBar />
          </div>
        </div>

        {/* Scrollable Content */}
        <main className="h-full overflow-y-auto pt-14 pb-24 overscroll-y-contain ios-scroll">
          {children}
        </main>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
          <div className="max-w-md mx-auto">
            <BottomNav />
          </div>
        </div>

      </div>
    </div>
  );
}