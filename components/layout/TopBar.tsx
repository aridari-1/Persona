"use client";

import { useRouter } from "next/navigation";
import { Bell, Send, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function TopBar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="h-14 px-4 flex items-center justify-between bg-[#0f0f0f] border-b border-[#1a1a1a]">

      {/* Brand */}
      <div
        onClick={() => router.push("/feed")}
        className="text-[15px] font-semibold tracking-wide cursor-pointer select-none"
      >
        Persona
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-6">

        <button
          onClick={() => router.push("/notifications")}
          className="text-gray-400 hover:text-white transition-fast"
        >
          <Bell size={20} strokeWidth={1.5} />
        </button>

        <button
          onClick={() => router.push("/messages")}
          className="text-gray-400 hover:text-white transition-fast"
        >
          <Send size={20} strokeWidth={1.5} />
        </button>

        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-500 transition-fast"
        >
          <LogOut size={20} strokeWidth={1.5} />
        </button>

      </div>
    </header>
  );
}