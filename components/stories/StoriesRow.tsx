"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Story {
  id: string;
  output_path: string;
  created_at: string;
}

export default function StoryViewer({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [stories, setStories] = useState<Story[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, [userId]);

  useEffect(() => {
    if (!stories.length) return;

    const timer = setTimeout(() => {
      if (index < stories.length - 1) {
        setIndex((prev) => prev + 1);
      } else {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [index, stories]);

  const fetchStories = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("stories")
      .select("id, output_path, created_at")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Story fetch error:", error);
      setLoading(false);
      return;
    }

    setStories(data || []);
    setIndex(0);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center text-white">
        Loading story...
      </div>
    );
  }

  if (!stories.length) {
    return null;
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/persona-stories/${stories[index].output_path}`;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">

      {/* Progress Bars */}
      <div className="absolute top-3 left-3 right-3 flex space-x-1">
        {stories.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded transition-all duration-300 ${
              i <= index ? "bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Story Image */}
      <img
        src={imageUrl}
        className="h-full w-full object-cover"
        alt=""
      />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white text-2xl"
      >
        ✕
      </button>

      {/* Tap Navigation */}
      <div
        className="absolute left-0 top-0 h-full w-1/2"
        onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
      />

      <div
        className="absolute right-0 top-0 h-full w-1/2"
        onClick={() =>
          index < stories.length - 1
            ? setIndex((prev) => prev + 1)
            : onClose()
        }
      />
    </div>
  );
}