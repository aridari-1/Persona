"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const linkClass = (path: string) =>
    `flex-1 text-center py-3 text-sm ${
      pathname === path ? "text-white" : "text-gray-500"
    }`;

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="border-t border-gray-800 bg-black fixed bottom-0 left-0 right-0 flex z-50">
        <Link href="/feed" className={linkClass("/feed")}>
          Home
        </Link>

        <Link href="/explore" className={linkClass("/explore")}>
          Explore
        </Link>

        {/* + Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex-1 text-center py-3 text-xl text-white"
        >
          +
        </button>

        <Link href="/stories" className={linkClass("/stories")}>
          Stories
        </Link>

        <Link href="/profile/me" className={linkClass("/profile/me")}>
          Profile
        </Link>
      </nav>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#111] w-80 rounded-2xl p-6 space-y-4">

            <h2 className="text-lg font-semibold text-center">
              Create
            </h2>

            <button
              onClick={() => {
                setShowCreateModal(false);
                router.push("/create");
              }}
              className="w-full neon-button py-3 rounded-xl text-black font-semibold"
            >
              Create Post
            </button>

            <button
              onClick={() => {
                setShowCreateModal(false);
                router.push("/stories/create");
              }}
              className="w-full border border-purple-500 py-3 rounded-xl"
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