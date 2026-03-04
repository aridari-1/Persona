"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Home, Search, Plus, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const iconClass = (path: string) =>
    `flex flex-col items-center justify-center flex-1 py-3 transition-fast ${
      pathname === path
        ? "text-white"
        : "text-gray-500 hover:text-gray-300"
    }`;

  return (
    <>
      {/* Bottom Navigation (position handled by (app)/layout.tsx fixed wrapper) */}
      <nav className="z-40 border-t border-[#1a1a1a] bg-[#0f0f0f] flex pb-[env(safe-area-inset-bottom)]">

        <Link href="/feed" className={iconClass("/feed")}>
          <Home size={22} strokeWidth={1.5} />
        </Link>

        <Link href="/search" className={iconClass("/search")}>
          <Search size={22} strokeWidth={1.5} />
        </Link>

        {/* Center Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center flex-1 py-3 text-white"
        >
          <Plus size={26} strokeWidth={1.8} />
        </button>

        <Link href="/profile/me" className={iconClass("/profile/me")}>
          <User size={22} strokeWidth={1.5} />
        </Link>

      </nav>

      {/* Create Modal (Minimal Bottom Sheet) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50">

          <div className="bg-[#141414] w-full max-w-md rounded-t-2xl p-6 space-y-5 animate-slide-up">

            <div className="w-12 h-[3px] bg-[#2a2a2a] rounded-full mx-auto mb-4" />

            <button
              onClick={() => {
                setShowCreateModal(false);
                router.push("/create");
              }}
              className="w-full bg-white text-black py-3 rounded-xl font-medium transition-fast hover:opacity-90"
            >
              Create Post
            </button>

            <button
              onClick={() => {
                setShowCreateModal(false);
                router.push("/stories/create");
              }}
              className="w-full border border-[#2a2a2a] py-3 rounded-xl text-gray-300 transition-fast hover:bg-[#1c1c1c]"
            >
              Create Story
            </button>

            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full text-gray-500 text-sm"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </>
  );
}