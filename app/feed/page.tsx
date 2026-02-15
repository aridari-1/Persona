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
  profiles: Profile;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  profiles: Profile;
};

export default function FeedPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [stories, setStories] = useState<Post[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const loadFeed = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/";
        return;
      }

      setCurrentUserId(user.id);

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
        const activeStories = data.filter(
          (p) =>
            p.type === "story" &&
            p.expires_at &&
            p.expires_at > nowISO
        );

        const permanentPosts = data.filter(
          (p) => p.type === "post"
        );

        setStories(activeStories);
        setPosts(permanentPosts);

        const { data: likesData } = await supabase
          .from("likes")
          .select("*");

        if (likesData) {
          const countMap: Record<string, number> = {};
          const likedSet = new Set<string>();

          likesData.forEach((like) => {
            countMap[like.post_id] =
              (countMap[like.post_id] || 0) + 1;

            if (like.user_id === user.id) {
              likedSet.add(like.post_id);
            }
          });

          setLikesMap(countMap);
          setLikedPosts(likedSet);
        }
      }

      setLoading(false);
    };

    loadFeed();
  }, []);

  const openComments = async (postId: string) => {
    setActivePostId(postId);

    const { data } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        profiles (
          id,
          username,
          avatar_url
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) setComments(data);
  };

  const addComment = async () => {
    if (!newComment.trim() || !activePostId || !currentUserId) return;

    const { data } = await supabase
      .from("comments")
      .insert({
        post_id: activePostId,
        user_id: currentUserId,
        content: newComment,
      })
      .select(`
        id,
        content,
        created_at,
        profiles (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (data) {
      setComments((prev) => [...prev, data]);
      setNewComment("");
    }
  };

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

      setLikesMap((prev) => ({
        ...prev,
        [postId]: Math.max((prev[postId] || 1) - 1, 0),
      }));
    } else {
      await supabase.from("likes").insert({
        user_id: currentUserId,
        post_id: postId,
      });

      setLikedPosts((prev) => new Set(prev).add(postId));

      setLikesMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1,
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">

      <div className="px-4 max-w-md mx-auto">

        {posts.map((post) => (
          <div key={post.id} className="mb-10">

            <div className="flex items-center gap-3 mb-3">
              <img
                src={post.profiles.avatar_url}
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="font-medium text-sm">
                @{post.profiles.username}
              </span>
            </div>

            <img
              src={post.media_url}
              className="w-full rounded-xl object-cover mb-3"
            />

            <div className="flex items-center gap-6 mb-2 text-xl">
              <button
                onClick={() => toggleLike(post.id)}
                className={
                  likedPosts.has(post.id)
                    ? "text-pink-500"
                    : "text-gray-400"
                }
              >
                ♥
              </button>
              <button onClick={() => openComments(post.id)}>
                💬
              </button>
            </div>

            <div className="text-sm font-medium mb-1">
              {likesMap[post.id] || 0} likes
            </div>

            {post.caption && (
              <div className="text-sm text-gray-300 mb-1">
                {post.caption}
              </div>
            )}

          </div>
        ))}
      </div>

      {/* COMMENTS MODAL */}
      {activePostId && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="bg-gray-900 w-full rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-bold">Comments</h2>
              <button onClick={() => setActivePostId(null)}>
                ✕
              </button>
            </div>

            {comments.map((comment) => (
              <div key={comment.id} className="mb-3">
                <span className="font-medium mr-2">
                  @{comment.profiles.username}
                </span>
                <span className="text-gray-300">
                  {comment.content}
                </span>
              </div>
            ))}

            <div className="mt-4 flex gap-3">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-black border border-gray-700 rounded-lg px-3 py-2"
              />
              <button
                onClick={addComment}
                className="text-blue-500"
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
