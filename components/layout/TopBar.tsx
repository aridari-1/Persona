"use client";

import { useRouter } from "next/navigation";
import { Bell, Send } from "lucide-react";

export default function TopBar() {
  const router = useRouter();

  return (
    <header className="h-14 px-4 flex items-center justify-between border-b border-gray-800 bg-black">

      {/* Logo / Brand */}
      <div
        onClick={() => router.push("/feed")}
        className="text-xl font-bold tracking-wide cursor-pointer select-none"
      >
        PERSONA
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-5">

        {/* Notifications */}
        <button
          onClick={() => router.push("/notifications")}
          className="text-gray-300 hover:text-white transition"
        >
          <Bell size={22} />
        </button>

        {/* Messages */}
        <button
          onClick={() => router.push("/messages")}
          className="text-gray-300 hover:text-white transition"
        >
          <Send size={22} />
        </button>

      </div>
    </header>
  );
}