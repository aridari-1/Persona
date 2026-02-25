"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query) {
        setResults([]);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_path")
        .or(
          `username.ilike.%${query}%,display_name.ilike.%${query}%`
        )
        .limit(10);

      if (!error && data) {
        setResults(data);
      }

      setLoading(false);
    };

    const delay = setTimeout(searchUsers, 300);
    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="pb-20 px-4">

      {/* Search Input */}
      <div className="sticky top-0 bg-black py-4">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#111] border border-gray-800 text-white"
        />
      </div>

      {/* Results */}
      <div className="mt-6 space-y-4">
        {loading && <p className="text-gray-500">Searching...</p>}

        {results.map((user) => (
          <Link
            key={user.id}
            href={`/profile/${user.username}`}
            className="flex items-center space-x-4 p-3 rounded-xl bg-[#111] hover:bg-[#1a1a1a]"
          >
            <img
              src={
                user.avatar_path
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/persona-avatars/${user.avatar_path}`
                  : "/default-avatar.png"
              }
              className="w-12 h-12 rounded-full object-cover"
              alt=""
            />

            <div>
              <p className="text-white font-semibold">
                {user.username}
              </p>
              <p className="text-gray-400 text-sm">
                {user.display_name}
              </p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}