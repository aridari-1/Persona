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
    const checkUserAndProfile = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      // 🔐 Not logged in
      if (!user) {
        router.replace("/login");
        return;
      }

      // 🔎 Check if profile exists
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      // 🚨 No profile → force onboarding
      if (!profile) {
        router.replace("/onboarding");
        return;
      }

      setLoading(false);
    };

    checkUserAndProfile();
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

      <TopBar />

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <BottomNav />

    </div>
  );
}