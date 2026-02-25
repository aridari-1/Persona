"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        router.replace("/login");
        return;
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* Top */}
      <TopBar />

      {/* Scrollable Feed Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom */}
      <BottomNav />

    </div>
  );
}