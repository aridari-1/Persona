"use client";

import Link from "next/link";

export default function TopNav() {
  return (
    <header className="
      fixed 
      top-0 
      left-0 
      right-0 
      z-50
      bg-black/95 
      backdrop-blur-md 
      border-b 
      border-gray-800
      pt-[env(safe-area-inset-top)]
    ">
      <div className="h-14 flex items-center justify-center px-4">
        <Link href="/feed">
          <h1 className="
            text-lg 
            sm:text-xl
            font-bold 
            tracking-wider 
            bg-gradient-to-r 
            from-purple-400 
            via-pink-500 
            to-blue-500 
            bg-clip-text 
            text-transparent
          ">
            PERSONA
          </h1>
        </Link>
      </div>
    </header>
  );
}
