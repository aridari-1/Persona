"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Profile = {
  id: string;
  username: string;
  avatar_url: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (value: string) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .ilike("username", `%${value}%`)
      .limit(20);

    if (data) {
      setResults(data);
    }

    setLoading(false);
  };

  return (
    <div className="h-dvh flex flex-col bg-black text-white">

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-black border-b border-gray-800 px-4 pt-6 pb-4">
        <h2 className="text-lg font-semibold tracking-wide mb-4">
          Search
        </h2>

        <div className="relative">
          <input
            type="text"
            placeholder="Search username..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
      </div>

      {/* Scrollable Results */}
      <div className="flex-1 overflow-y-auto pb-28">

        {loading && (
          <div className="px-4 py-6 text-gray-500 text-sm">
            Searching...
          </div>
        )}

        <div className="divide-y divide-gray-900">
          {results.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className="flex items-center gap-3 px-4 py-4 active:bg-gray-900 transition"
            >
              <img
                src={user.avatar_url}
                className="w-10 h-10 rounded-full object-cover"
                alt=""
              />

              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {user.username}
                </span>
                <span className="text-xs text-gray-500">
                  @{user.username}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {!loading && query && results.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-500 text-sm">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
