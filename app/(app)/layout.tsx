"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        router.replace("/");
      }
    };

    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto relative">

        <div className="fixed top-0 w-full max-w-md z-50">
          <TopBar />
        </div>

        <div className="pt-16 pb-20">
          {children}
        </div>

        <div className="fixed bottom-0 w-full max-w-md z-50">
          <BottomNav />
        </div>

      </div>
    </div>
  );
}