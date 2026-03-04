"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  userId,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  userId: string;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggleLike = async () => {
    if (loading) return;
    setLoading(true);

    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      setLiked(false);
      setCount((c) => c - 1);
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: userId,
      });

      setLiked(true);
      setCount((c) => c + 1);
    }

    setLoading(false);
  };

  return (
    <div className="px-4 py-3">
      <button
        onClick={toggleLike}
        className="flex items-center space-x-2"
      >
        <span className={`text-xl ${liked ? "text-red-500" : "text-white"}`}>
          {liked ? "♥" : "♡"}
        </span>
        <span className="text-sm text-gray-300">
          {count}
        </span>
      </button>
    </div>
  );
}