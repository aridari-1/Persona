"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const iconClass = (path: string) =>
    `flex flex-col items-center justify-center flex-1 py-3 transition-fast ${
      pathname === path ? "text-white" : "text-gray-500 hover:text-gray-300"
    }`;

  return (
    <nav className="z-40 border-t border-[#1a1a1a] bg-[#0f0f0f] flex pb-[env(safe-area-inset-bottom)]">

      <Link href="/feed" className={iconClass("/feed")}>
        <Home size={22} strokeWidth={1.5} />
      </Link>

      <Link href="/search" className={iconClass("/search")}>
        <Search size={22} strokeWidth={1.5} />
      </Link>

      {/* CREATE BUTTON */}
      <Link
        href="/create"
        className="flex items-center justify-center flex-1 py-3 text-white"
      >
        <Plus size={26} strokeWidth={1.8} />
      </Link>

      <Link href="/profile/me" className={iconClass("/profile/me")}>
        <User size={22} strokeWidth={1.5} />
      </Link>

    </nav>
  );
}