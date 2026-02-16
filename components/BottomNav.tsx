"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `flex-1 text-center text-xl ${
      pathname === path ? "text-white" : "text-gray-500"
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-black border-t border-gray-800 flex items-center z-50">
      <Link href="/feed" className={linkClass("/feed")}>
        🏠
      </Link>

      <Link href="/create-story" className={linkClass("/create-story")}>
        ➕
      </Link>

      <Link href="/profile" className={linkClass("/profile")}>
        👤
      </Link>
    </div>
  );
}
