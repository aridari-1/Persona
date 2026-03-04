"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Story {
  id: string;
  created_at: string;
  story_media: {
    output_path: string;
  }[];
}

export default function StoryPage() {
  const { userId } = useParams();
  const router = useRouter();

  const [stories, setStories] = useState<Story[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    if (!stories.length) return;

    const timer = setTimeout(() => {
      if (index < stories.length - 1) {
        setIndex((prev) => prev + 1);
      } else {
        router.back();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [index, stories]);

  const fetchStories = async () => {
    const { data } = await supabase
      .from("stories")
      .select(`
        id,
        created_at,
        story_media (
          output_path
        )
      `)
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });

    setStories(data || []);
  };

  if (!stories.length) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        No active stories
      </div>
    );
  }

  const media = stories[index]?.story_media?.[0];
  if (!media) return null;

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/persona-stories/${media.output_path}`;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">

      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1">
        {stories.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${
              i <= index ? "bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>

      <img
        src={imageUrl}
        className="h-full w-full object-cover"
        alt=""
      />

      <button
        onClick={() => router.back()}
        className="absolute top-6 right-6 text-white text-2xl"
      >
        ✕
      </button>

      <div
        className="absolute left-0 top-0 h-full w-1/2"
        onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
      />
      <div
        className="absolute right-0 top-0 h-full w-1/2"
        onClick={() =>
          index < stories.length - 1
            ? setIndex((prev) => prev + 1)
            : router.back()
        }
      />
    </div>
  );
}