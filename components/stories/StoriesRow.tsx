"use client";

import { useEffect, useState, useRef } from "react";
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
  const [imageLoaded, setImageLoaded] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  /* ---------------------------------- */
  /* FETCH STORIES                      */
  /* ---------------------------------- */

  useEffect(() => {
    fetchStories();
  }, [userId]);

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

  /* ---------------------------------- */
  /* STORY TIMER                        */
  /* ---------------------------------- */

  useEffect(() => {

    if (!stories.length) return;

    setImageLoaded(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {

      if (index < stories.length - 1) {
        setIndex((prev) => prev + 1);
      } else {
        onClose();
      }

    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

  }, [index, stories.length, onClose]);

  /* ---------------------------------- */
  /* LOADING SCREEN                     */
  /* ---------------------------------- */

  if (loading) {

    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">

        <div className="flex flex-col items-center space-y-4 text-white">

          <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

          <p className="text-sm text-gray-400">
            Loading story...
          </p>

        </div>

      </div>
    );

  }

  if (!stories.length) return null;

  /* ---------------------------------- */
  /* FIX OLD PATHS                      */
  /* ---------------------------------- */

  let cleanPath = stories[index].output_path;

  if (cleanPath.includes("/posts/")) {
    cleanPath = cleanPath.replace("/posts/", "/stories/");
  }

  const imageUrl =
    `${supabaseUrl}/storage/v1/object/public/persona-stories/${cleanPath}`;

  /* ---------------------------------- */
  /* PRELOAD NEXT STORY                 */
  /* ---------------------------------- */

  if (index < stories.length - 1) {

    const next = stories[index + 1];

    const nextPath =
      `${supabaseUrl}/storage/v1/object/public/persona-stories/${next.output_path}`;

    const img = new Image();
    img.src = nextPath;

  }

  return (

    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">

      {/* PROGRESS BARS */}

      <div className="absolute top-3 left-3 right-3 flex space-x-1">

        {stories.map((_, i) => (

          <div
            key={i}
            className={`h-1 flex-1 rounded ${
              i <= index ? "bg-white" : "bg-white/30"
            }`}
          />

        ))}

      </div>


      {/* STORY IMAGE */}

      <img
        src={imageUrl}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => {

          if (index < stories.length - 1) {
            setIndex((prev) => prev + 1);
          } else {
            onClose();
          }

        }}
        alt="story"
      />


      {/* CLOSE BUTTON */}

      <button
        onClick={onClose}
        className="absolute top-5 right-5 text-white text-2xl hover:opacity-70"
      >
        ✕
      </button>


      {/* TAP LEFT */}

      <div
        className="absolute left-0 top-0 h-full w-1/2 cursor-pointer"
        onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
      />


      {/* TAP RIGHT */}

      <div
        className="absolute right-0 top-0 h-full w-1/2 cursor-pointer"
        onClick={() =>
          index < stories.length - 1
            ? setIndex((prev) => prev + 1)
            : onClose()
        }
      />

    </div>

  );

}
