"use client";

import { useEffect, useState, useRef } from "react";
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
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  /* ---------------------------------- */
  /* INITIALIZE                         */
  /* ---------------------------------- */

  useEffect(() => {
    setMounted(true);
    fetchStories();
  }, [userId]);

  const fetchStories = async () => {

    setLoading(true);

    const { data, error } = await supabase
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
  /* MARK STORY VIEWED                  */
  /* ---------------------------------- */

  const markViewed = async (storyId: string) => {

    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) return;

    await supabase
      .from("story_views")
      .upsert({
        story_id: storyId,
        viewer_id: user.id,
      });

  };

  useEffect(() => {
    if (!stories[index]) return;
    markViewed(stories[index].id);
  }, [index]);

  /* ---------------------------------- */
  /* STORY TIMER                        */
  /* ---------------------------------- */

  useEffect(() => {

    if (!stories.length || paused || !loaded) return;

    if (timerRef.current) clearTimeout(timerRef.current);

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

  }, [index, stories.length, paused, loaded, onClose]);

  /* ---------------------------------- */
  /* SWIPE NAVIGATION                   */
  /* ---------------------------------- */

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {

    if (!touchStartX.current) return;

    const diff = touchStartX.current - e.changedTouches[0].clientX;

    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      nextStory();
    } else {
      prevStory();
    }

  };

  const nextStory = () => {

    if (index < stories.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      onClose();
    }

  };

  const prevStory = () => {
    setIndex((prev) => Math.max(0, prev - 1));
  };

  /* ---------------------------------- */
  /* LOADING STATE                      */
  /* ---------------------------------- */

  if (!mounted) return null;

  if (loading) {

    const modal = (
      <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">

        <div className="flex flex-col items-center space-y-4 text-white">

          <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

          <p className="text-sm text-gray-400">
            Loading story...
          </p>

        </div>

      </div>
    );

    return createPortal(modal, document.body);
  }

  if (!stories.length) return null;

  const media = stories[index]?.story_media?.[0];
  if (!media?.output_path) return null;

  /* ---------------------------------- */
  /* CLEAN PATH FIX                     */
  /* ---------------------------------- */

  let cleanPath = media.output_path;

  if (cleanPath.includes("/posts/")) {
    cleanPath = cleanPath.replace("/posts/", "/stories/");
  }

  const imageUrl =
    `${supabaseUrl}/storage/v1/object/public/persona-stories/${cleanPath}`;

  /* ---------------------------------- */
  /* PRELOAD NEXT STORY                 */
  /* ---------------------------------- */

  if (index < stories.length - 1) {

    const nextMedia = stories[index + 1]?.story_media?.[0];

    if (nextMedia?.output_path) {

      const nextImg = new Image();

      nextImg.src =
        `${supabaseUrl}/storage/v1/object/public/persona-stories/${nextMedia.output_path}`;

    }

  }

  /* ---------------------------------- */
  /* MODAL                              */
  /* ---------------------------------- */

  const modal = (

    <div
      className="fixed inset-0 bg-black z-[9999] flex items-center justify-center"
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true);
        handleTouchStart(e);
      }}
      onTouchEnd={(e) => {
        setPaused(false);
        handleTouchEnd(e);
      }}
    >

      {/* Progress bars */}

      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">

        {stories.map((_, i) => (

          <div
            key={i}
            className="h-1 flex-1 bg-white/30 rounded overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all duration-5000 ${
                i < index ? "w-full" : i === index ? "w-full animate-progress" : "w-0"
              }`}
            />
          </div>

        ))}

      </div>

      {/* Story image */}

      <img
        src={imageUrl}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => nextStory()}
        alt="story"
      />

      {/* Close */}

      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white text-2xl hover:opacity-70 z-20"
      >
        ✕
      </button>

      {/* Tap navigation */}

      <div
        className="absolute left-0 top-0 h-full w-1/2 cursor-pointer"
        onClick={prevStory}
      />

      <div
        className="absolute right-0 top-0 h-full w-1/2 cursor-pointer"
        onClick={nextStory}
      />

    </div>

  );

  return createPortal(modal, document.body);

}
