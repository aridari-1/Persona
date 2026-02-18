"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type FeedRow = {
  id: string;
  user_id: string;
  type: "story" | "post";
  media_url: string;
  caption: string | null;
  title: string | null;
  created_at: string;
  expires_at: string | null;
  profile_id: string;
  username: string;
  avatar_url: string;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string;
};

export default function FeedPage() {
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const [activePost, setActivePost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      if (!user) {
        window.location.href = "/";
        return;
      }

      setCurrentUserId(user.id);

      const { data: meProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      setCurrentUsername(meProfile?.username ?? null);

      const { data } = await supabase.rpc("get_feed_posts");
      setRows((data as FeedRow[]) ?? []);

      const { data: likesData } = await supabase.from("likes").select("*");

      if (likesData) {
        const countMap: Record<string, number> = {};
        const likedSet = new Set<string>();

        likesData.forEach((like: any) => {
          countMap[like.post_id] =
            (countMap[like.post_id] || 0) + 1;

          if (like.user_id === user.id) {
            likedSet.add(like.post_id);
          }
        });

        setLikes(countMap);
        setLikedPosts(likedSet);
      }

      setLoading(false);
    };

    load();
  }, []);

  const { posts } = useMemo(() => {
    return {
      posts: rows.filter((r) => r.type === "post"),
    };
  }, [rows]);

  const toggleLike = async (postId: string) => {
    if (!currentUserId) return;

    if (likedPosts.has(postId)) {
      await supabase
        .from("likes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("post_id", postId);

      setLikedPosts((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });

      setLikes((prev) => ({
        ...prev,
        [postId]: Math.max((prev[postId] || 1) - 1, 0),
      }));
    } else {
      await supabase.from("likes").insert({
        user_id: currentUserId,
        post_id: postId,
      });

      setLikedPosts((prev) => new Set(prev).add(postId));

      setLikes((prev) => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      }));
    }
  };

  const openComments = async (postId: string) => {
    setActivePost(postId);

    const { data } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        profiles ( username, avatar_url )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) {
      const normalized: Comment[] = data.map((c: any) => {
        const profile = Array.isArray(c.profiles)
          ? c.profiles[0]
          : c.profiles;

        return {
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          username: profile?.username ?? "user",
          avatar_url: profile?.avatar_url ?? "",
        };
      });

      setComments(normalized);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !activePost || !currentUserId) return;

    const { data } = await supabase
      .from("comments")
      .insert({
        post_id: activePost,
        user_id: currentUserId,
        content: newComment,
      })
      .select(`
        id,
        content,
        created_at,
        profiles ( username, avatar_url )
      `)
      .single();

    if (data) {
      const profile = Array.isArray(data.profiles)
        ? data.profiles[0]
        : data.profiles;

      setComments((prev) => [
        ...prev,
        {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          username: profile?.username ?? "user",
          avatar_url: profile?.avatar_url ?? "",
        },
      ]);

      setNewComment("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black text-gray-400 text-sm">
        Loading your world...
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-black text-white overflow-x-hidden">

      {/* CONTENT */}
      <div className="pb-24">

        {posts.map((p) => (
          <div key={p.id} className="border-b border-gray-900">

            {/* HEADER */}
            <Link href={`/profile/${p.username}`}>
              <div className="flex items-center gap-3 px-4 py-3 active:opacity-70">
                <img
                  src={p.avatar_url}
                  className="w-8 h-8 rounded-full object-cover"
                  alt=""
                />
                <span className="text-sm font-semibold">
                  {p.username}
                </span>
              </div>
            </Link>

            {/* IMAGE */}
            <div className="w-full bg-black">
              <img
                src={p.media_url}
                className="w-full h-auto object-cover"
                alt=""
              />
            </div>

            {/* ACTIONS */}
            <div className="px-4 py-3">

              <div className="flex items-center gap-6 text-2xl mb-2">
                <button
                  onClick={() => toggleLike(p.id)}
                  className={`active:scale-90 transition ${
                    likedPosts.has(p.id)
                      ? "text-red-500"
                      : "text-white"
                  }`}
                >
                  ♥
                </button>

                <button
                  onClick={() => openComments(p.id)}
                  className="active:scale-90 transition"
                >
                  💬
                </button>
              </div>

              <div className="text-sm font-semibold mb-1">
                {likes[p.id] || 0} likes
              </div>

              {p.title && (
                <div className="text-sm font-semibold">
                  {p.title}
                </div>
              )}

              {p.caption && (
                <div className="text-sm text-gray-400 break-words">
                  {p.caption}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* COMMENT MODAL */}
      {activePost && (
        <div className="fixed inset-0 bg-black/95 flex items-end z-50">

          <div className="w-full bg-black rounded-t-3xl border-t border-gray-800 flex flex-col max-h-[85vh]">

            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-900">
              <h2 className="text-base font-semibold">Comments</h2>
              <button
                onClick={() => setActivePost(null)}
                className="text-xl"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 mb-4">
                  <img
                    src={c.avatar_url}
                    className="w-7 h-7 rounded-full object-cover"
                    alt=""
                  />
                  <div className="text-sm">
                    <span className="font-semibold mr-2">
                      {c.username}
                    </span>
                    <span className="text-gray-300 break-words">
                      {c.content}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-900 px-4 py-3 flex gap-3">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-2 text-sm"
              />
              <button
                onClick={addComment}
                className="text-blue-500 font-semibold"
              >
                Post
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
