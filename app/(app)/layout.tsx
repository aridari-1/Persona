"use client";

import { useRef, useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import SplashScreen from "@/components/SplashScreen";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

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