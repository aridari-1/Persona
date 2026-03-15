"use client";

import { useRef } from "react";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement | null>(null);

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-black text-white">
      <header className="flex-shrink-0 border-b border-[#1a1a1a]">
        <TopBar />
      </header>

      <main
        ref={(el) => {
          mainRef.current = el;
        }}
        className="flex-1 overflow-y-auto ios-scroll"
      >
        {children}
      </main>

      <footer className="flex-shrink-0 border-t border-[#1a1a1a] pb-[env(safe-area-inset-bottom)]">
        <BottomNav />
      </footer>
    </div>
  );
}
