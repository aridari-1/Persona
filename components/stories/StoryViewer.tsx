"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";

interface Story {
  id: string;
  created_at: string;
  story_media: {
    output_path: string;
  }[];
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
  const [mounted, setMounted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    setMounted(true);
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
    setIndex(0);

  };

  if (!mounted || !stories.length) return null;

  const media = stories[index]?.story_media?.[0];

  if (!media?.output_path) return null;

  // 🔧 FIX incorrect paths if old data contains /posts/
  let cleanPath = media.output_path;

  if (cleanPath.includes("/posts/")) {
    cleanPath = cleanPath.replace("/posts/", "/stories/");
  }

  const imageUrl =
    `${supabaseUrl}/storage/v1/object/public/persona-stories/${cleanPath}`;

  const modal = (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">

      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">

        {stories.map((_, i) => (

          <div
            key={i}
            className={`h-1 flex-1 rounded ${
              i <= index ? "bg-white" : "bg-white/30"
            }`}
          />

        ))}

      </div>

      {/* Image */}
      <img
        src={imageUrl}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (index < stories.length - 1) {
            setIndex((prev) => prev + 1);
          } else {
            onClose();
          }
        }}
        alt=""
      />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white text-2xl z-20"
      >
        ✕
      </button>

      {/* Navigation */}
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

  return createPortal(modal, document.body);

}