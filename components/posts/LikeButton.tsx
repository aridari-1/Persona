"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Heart } from "lucide-react";

interface Props {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  userId: string;
  postOwnerId?: string; // used for notifications
}

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  userId,
  postOwnerId,
}: Props) {

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggleLike = async () => {

    if (loading) return;

    setLoading(true);

    try {

      if (liked) {

        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", userId)
          .eq("target_type", "post")
          .eq("target_id", postId);

        if (error) throw error;

        setLiked(false);
        setCount((c) => Math.max(c - 1, 0));

      } else {

        const { error } = await supabase
          .from("likes")
          .insert({
            user_id: userId,
            target_type: "post",
            target_id: postId,
          });

        if (error) throw error;

        setLiked(true);
        setCount((c) => c + 1);

        // ======================
        // CREATE NOTIFICATION
        // ======================

        if (postOwnerId && postOwnerId !== userId) {

          await supabase.from("notifications").insert({
            type: "like",
            actor_id: userId,
            recipient_id: postOwnerId,
            post_id: postId,
            is_read: false,
          });

        }

      }

    } catch (err) {

      console.error("Like error:", err);

    }

    setLoading(false);

  };

  return (
    <button
      onClick={toggleLike}
      disabled={loading}
      className="flex items-center gap-2"
    >

      <Heart
        size={24}
        className={
          liked
            ? "text-red-500 fill-red-500"
            : "text-white"
        }
      />

      <span className="text-sm text-gray-300">
        {count}
      </span>

    </button>
  );
}