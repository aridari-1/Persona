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
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [likes, setLikes] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const [activePost, setActivePost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrMsg(null);

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

      const { data, error } = await supabase.rpc("get_feed_posts");

      if (error) {
        setErrMsg(error.message);
        setRows([]);
      } else {
        setRows((data as FeedRow[]) ?? []);
      }

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

  const { stories, posts } = useMemo(() => {
    const nowISO = new Date().toISOString();
    return {
      stories: rows.filter(
        (r) => r.type === "story" && r.expires_at && r.expires_at > nowISO
      ),
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
      const normalized = data.map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        username: c.profiles?.username,
        avatar_url: c.profiles?.avatar_url,
      }));
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
      setComments((prev) => [
        ...prev,
        {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          username: data.profiles?.username,
          avatar_url: data.profiles?.avatar_url,
        },
      ]);
      setNewComment("");
    }
  };

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black text-gray-400 text-sm">
        Loading your world...
      </div>
    );
  }

  return (
    <div className="h-dvh flex flex-col bg-black text-white">

      {/* TOP NAV */}
      <div className="sticky top-0 bg-black border-b border-gray-800 px-5 py-4 flex justify-between items-center z-40">
        <h1 className="text-xl font-bold tracking-wide">PERSONA</h1>
        {currentUsername && (
          <Link href={`/profile/${currentUsername}`} className="text-xl">
            👤
          </Link>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-28">

        {posts.map((p) => (
          <div key={p.id} className="border-b border-gray-900">

            {/* HEADER */}
            <Link href={`/profile/${p.username}`}>
              <div className="flex items-center gap-3 px-4 py-3">
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
            <img
              src={p.media_url}
              className="w-full object-cover"
              alt=""
            />

            {/* LIKE + COMMENT BAR */}
            <div className="px-4 py-3">

              <div className="flex items-center gap-6 text-2xl mb-2">
                <button
                  onClick={() => toggleLike(p.id)}
                  className={
                    likedPosts.has(p.id)
                      ? "text-red-500"
                      : "text-white"
                  }
                >
                  ♥
                </button>

                <button onClick={() => openComments(p.id)}>
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
                <div className="text-sm text-gray-400">
                  {p.caption}
                </div>
              )}

            </div>
          </div>
        ))}
      </div>

      {/* COMMENT MODAL */}
      {activePost && (
        <div className="fixed inset-0 bg-black/80 flex items-end z-50">

          <div className="bg-black w-full rounded-t-3xl p-5 max-h-[75vh] overflow-y-auto border-t border-gray-800">

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Comments</h2>
              <button onClick={() => setActivePost(null)}>✕</button>
            </div>

            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 mb-4">
                <img
                  src={c.avatar_url}
                  className="w-7 h-7 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <span className="text-sm font-semibold mr-2">
                    {c.username}
                  </span>
                  <span className="text-sm text-gray-300">
                    {c.content}
                  </span>
                </div>
              </div>
            ))}

            {/* INPUT */}
            <div className="mt-4 flex gap-3">
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

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 flex justify-around items-center py-4 text-xl z-50">
        <Link href="/feed">🏠</Link>
        <Link href="/search">🔍</Link>
        <Link href="/create-story">➕</Link>
        {currentUsername && (
          <Link href={`/profile/${currentUsername}`}>👤</Link>
        )}
      </div>
    </div>
  );
}
