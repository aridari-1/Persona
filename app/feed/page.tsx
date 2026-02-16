"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type Profile = {
  id: string;
  username: string;
  avatar_url: string;
};

type Post = {
  id: string;
  user_id: string;
  type: "story" | "post";
  media_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string | null;
  profiles: Profile | null;
};

export default function FeedPage() {
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [stories, setStories] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setCurrentUsername(profileData.username);
      }

      const nowISO = new Date().toISOString();

      const { data } = await supabase
        .from("posts")
        .select(`
          id,
          user_id,
          type,
          media_url,
          caption,
          created_at,
          expires_at,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (data) {
        const normalized: Post[] = data.map((item: any) => ({
          ...item,
          profiles: item.profiles || null,
        }));

        setStories(
          normalized.filter(
            (p) =>
              p.type === "story" &&
              p.expires_at &&
              p.expires_at > nowISO
          )
        );

        setPosts(
          normalized.filter((p) => p.type === "post")
        );
      }

      setLoading(false);
    };

    loadFeed();
  }, []);

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-black text-white">

      {/* 🔝 TOP NAV */}
      <div className="sticky top-0 bg-black border-b border-gray-800 px-4 py-4 flex justify-between items-center z-40">
        <h1 className="text-xl font-bold tracking-wide">PERSONA</h1>
        {currentUsername && (
          <Link href={`/profile/${currentUsername}`} className="text-xl">
            👤
          </Link>
        )}
      </div>

      {/* 🔥 SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">

        {/* STORIES */}
        {stories.length > 0 && (
          <div className="flex gap-4 overflow-x-auto py-4 mb-4 scrollbar-hide">
            {stories.map((story) => (
              <div key={story.id} className="text-center min-w-[70px]">
                {story.profiles && (
                  <Link href={`/profile/${story.profiles.username}`}>
                    <img
                      src={story.profiles.avatar_url}
                      className="w-14 h-14 rounded-full object-cover mx-auto mb-1 border-2 border-pink-500"
                    />
                    <div className="text-xs truncate w-16">
                      {story.profiles.username}
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {posts.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            No posts yet.
          </div>
        )}

        {/* POSTS */}
        {posts.map((post) => (
          <div key={post.id} className="mb-8">

            {post.profiles && (
              <Link href={`/profile/${post.profiles.username}`}>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={post.profiles.avatar_url}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <span className="text-sm font-medium">
                    @{post.profiles.username}
                  </span>
                </div>
              </Link>
            )}

            <img
              src={post.media_url}
              className="w-full rounded-xl object-cover"
            />

            {post.caption && (
              <div className="mt-2 text-sm text-gray-300">
                {post.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 🔻 BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 flex justify-around items-center py-4 text-xl z-50">
        <Link href="/feed" className="px-4">🏠</Link>
        <Link href="/search" className="px-4">🔍</Link>
        <Link href="/create-story" className="px-4 text-2xl">➕</Link>
        {currentUsername && (
          <Link href={`/profile/${currentUsername}`} className="px-4">👤</Link>
        )}
      </div>

    </div>
  );
}
