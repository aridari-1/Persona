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
    <div className="min-h-screen bg-black text-white px-6 py-10">

      <h2 className="text-2xl font-bold mb-6">Search Users</h2>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search username..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full p-3 bg-black border border-gray-700 rounded-xl mb-6"
      />

      {loading && (
        <div className="text-gray-500">Searching...</div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.map((user) => (
          <Link
            key={user.id}
            href={`/profile/${user.username}`}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-900 transition"
          >
            <img
              src={user.avatar_url}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="font-medium">
              @{user.username}
            </span>
          </Link>
        ))}

        {!loading && query && results.length === 0 && (
          <div className="text-gray-500">
            No users found.
          </div>
        )}
      </div>

    </div>
  );
}
