"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `flex flex-col items-center justify-center flex-1 text-xs transition ${
      pathname === path
        ? "text-white"
        : "text-gray-500"
    }`;

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0
        bg-black/95 backdrop-blur-md
        border-t border-gray-800
        flex items-center
        h-16
        pb-safe
        z-50
      "
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <Link href="/feed" className={linkClass("/feed")}>
        <span className="text-xl">🏠</span>
        <span className="mt-1">Home</span>
      </Link>

      <Link href="/create-story" className={linkClass("/create-story")}>
        <span className="text-2xl">➕</span>
        <span className="mt-1">Create</span>
      </Link>

      <Link href="/profile" className={linkClass("/profile")}>
        <span className="text-xl">👤</span>
        <span className="mt-1">Profile</span>
      </Link>
    </div>
  );
}
