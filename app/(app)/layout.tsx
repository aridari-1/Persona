"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const user = sessionRes.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!profile?.onboarding_completed) {
        router.replace("/onboarding");
        return;
      }

      setAllowed(true);
    };

    checkAccess();
  }, [router]);

  if (!allowed) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
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