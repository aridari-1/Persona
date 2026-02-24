"use client";

import { supabase } from "@/lib/supabaseClient";

export default function TopBar() {
  return (
    <header className="border-b border-gray-800 p-4 flex justify-between items-center bg-black">

      <h1 className="text-xl font-bold neon-text">
        PERSONA
      </h1>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        }}
        className="text-sm text-gray-400 hover:text-white"
      >
        Logout
      </button>

    </header>
  );
}