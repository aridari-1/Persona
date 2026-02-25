"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Home, Search, PlusSquare, Clapperboard, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const iconClass = (path: string) =>
    `flex flex-col items-center justify-center flex-1 py-2 transition ${
      pathname === path ? "text-white" : "text-gray-500"
    }`;

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="border-t border-gray-800 bg-black flex pb-[env(safe-area-inset-bottom)]">

        <Link href="/feed" className={iconClass("/feed")}>
          <Home size={24} />
        </Link>

        <Link href="/explore" className={iconClass("/explore")}>
          <Search size={24} />
        </Link>

        {/* Center Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center flex-1 py-2 text-white"
        >
          <PlusSquare size={28} />
        </button>

        <Link href="/stories" className={iconClass("/stories")}>
          <Clapperboard size={24} />
        </Link>

        <Link href="/profile/me" className={iconClass("/profile/me")}>
          <User size={24} />
        </Link>

      </nav>

      {/* Create Modal (Bottom Sheet Style) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50">

          <div className="bg-[#111] w-full max-w-md rounded-t-2xl p-6 space-y-4 animate-slide-up">

            <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-4" />

            <button
              onClick={() => {
                setShowCreateModal(false);
                router.push("/create");
              }}
              className="w-full bg-purple-600 py-3 rounded-xl font-semibold"
            >
              Create Post
            </button>

            <button
              onClick={() => {
                setShowCreateModal(false);
                router.push("/stories/create");
              }}
              className="w-full border border-gray-700 py-3 rounded-xl"
            >
              Create Story
            </button>

            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full text-gray-400 text-sm mt-2"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </>
  );
}