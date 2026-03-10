"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

const MAX_RESULTS = 12;

export default function SearchPage() {

  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [recent, setRecent] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /* -------------------------
     LOAD RECENT SEARCHES
  ------------------------- */

  useEffect(() => {

    const stored = localStorage.getItem("recent_searches");

    if (stored) {
      setRecent(JSON.parse(stored));
    }

  }, []);

  /* -------------------------
     SEARCH USERS
  ------------------------- */

  useEffect(() => {

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {

      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(
          `username.ilike.%${query}%,display_name.ilike.%${query}%`
        )
        .order("username", { ascending: true })
        .limit(MAX_RESULTS);

      if (!error && data) {
        setResults(data);
      }

      setLoading(false);

    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };

  }, [query]);

  /* -------------------------
     SAVE RECENT SEARCH
  ------------------------- */

  const saveRecent = (user: Profile) => {

    const updated = [
      user,
      ...recent.filter((r) => r.id !== user.id),
    ].slice(0, 6);

    setRecent(updated);

    localStorage.setItem(
      "recent_searches",
      JSON.stringify(updated)
    );

  };

  /* -------------------------
     USER CLICK
  ------------------------- */

  const openProfile = (user: Profile) => {

    saveRecent(user);

    router.push(`/profile/${user.username}`);

  };

  /* -------------------------
     CLEAR SEARCH
  ------------------------- */

  const clearSearch = () => {

    setQuery("");
    setResults([]);

  };

  return (

    <div className="pb-24 px-4 max-w-xl mx-auto">

      {/* SEARCH INPUT */}

      <div className="sticky top-0 bg-black pt-4 pb-3 z-10">

        <div className="relative">

          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 pl-4 pr-10 rounded-xl bg-[#111] border border-gray-800 text-white outline-none"
          />

          {query && (

            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              ✕
            </button>

          )}

        </div>

      </div>

      {/* LOADING */}

      {loading && (
        <p className="text-gray-500 mt-6 text-sm">
          Searching...
        </p>
      )}

      {/* EMPTY RESULT */}

      {!loading && query && results.length === 0 && (

        <p className="text-gray-500 mt-6 text-sm">
          No users found
        </p>

      )}

      <div className="mt-4 space-y-2">

        {(query ? results : recent).map((user) => (

          <div
            key={user.id}
            onClick={() => openProfile(user)}
            className="flex items-center space-x-3 p-3 rounded-xl bg-[#111] hover:bg-[#1a1a1a] cursor-pointer transition"
          >

            {/* Avatar */}

            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0f0f0f]">

              {user.avatar_url ? (

                <Image
                  src={user.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  className="object-cover"
                />

              ) : (

                <Image
                  src="/default-avatar.png"
                  alt=""
                  width={32}
                  height={32}
                  className="object-cover"
                />

              )}

            </div>

            {/* User Info */}

            <div className="flex flex-col">

              <span className="text-white font-medium text-[14px]">
                {user.username}
              </span>

              <span className="text-gray-400 text-[12px]">
                {user.display_name}
              </span>

            </div>

          </div>

        ))}

      </div>

      {/* RECENT SEARCH TITLE */}

      {!query && recent.length > 0 && (

        <div className="mt-6">

          <p className="text-gray-500 text-xs mb-2">
            Recent searches
          </p>

        </div>

      )}

    </div>

  );

}