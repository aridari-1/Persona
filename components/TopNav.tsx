"use client";

import Link from "next/link";

export default function TopNav() {
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-black border-b border-gray-800 flex items-center justify-center z-50">
      <Link href="/feed">
        <h1 className="text-lg font-bold neon-text">PERSONA</h1>
      </Link>
    </div>
  );
}
