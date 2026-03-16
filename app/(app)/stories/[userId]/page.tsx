"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Story {
  id: string;
  created_at: string;
  story_media: {
    output_path: string;
  }[];
}

const STORY_DURATION = 5000;
const SWIPE_THRESHOLD = 70;

export default function StoryPage() {

  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  const router = useRouter();

  const [stories, setStories] = useState<Story[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const startX = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  /* ---------------- FETCH STORIES ---------------- */

  useEffect(() => {
    fetchStories();
  }, [userId]);

  const fetchStories = async () => {

    setLoading(true);

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
    setLoading(false);
  };

  /* ---------------- STORY PROGRESS ---------------- */

  useEffect(() => {

    if (!stories.length || !loaded || paused) return;

    setProgress(0);

    const start = Date.now();

    timerRef.current = setInterval(() => {

      if (paused) return;

      const elapsed = Date.now() - start;
      const percent = (elapsed / STORY_DURATION) * 100;

      setProgress(percent);

      if (percent >= 100) {

        clearInterval(timerRef.current!);

        if (index < stories.length - 1) {
          setIndex(prev => prev + 1);
        } else {
          router.back();
        }

      }

    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };

  }, [index, stories, loaded, paused]);

  useEffect(() => {
    setLoaded(false);
  }, [index]);

  /* ---------------- MARK STORY VIEWED ---------------- */

  useEffect(() => {

    const markViewed = async () => {

      const { data: sessionData } = await supabase.auth.getSession();
      const viewer = sessionData.session?.user;

      if (!viewer || !stories[index]) return;

      await supabase.from("story_views").upsert({
        story_id: stories[index].id,
        viewer_id: viewer.id
      });

    };

    markViewed();

  }, [index]);

  /* ---------------- PRELOAD NEXT STORY ---------------- */

  useEffect(() => {

    const next = stories[index + 1];

    if (!next) return;

    const nextMedia = next.story_media?.[0];
    if (!nextMedia?.output_path) return;

    const img = new Image();

    img.src =
      `${supabaseUrl}/storage/v1/object/public/persona-stories/${nextMedia.output_path}`;

  }, [index]);

  /* ---------------- SWIPE GESTURE ---------------- */

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {

    if (startX.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const diff = startX.current - endX;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {

      if (diff > 0) {
        nextStory();
      } else {
        prevStory();
      }

    }

    startX.current = null;
  };

  /* ---------------- NAVIGATION ---------------- */

  const nextStory = () => {

    if (index < stories.length - 1) {
      setIndex(prev => prev + 1);
    } else {
      router.back();
    }

  };

  const prevStory = () => {
    setIndex(prev => Math.max(0, prev - 1));
  };

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-gray-400">
        Loading stories...
      </div>
    );
  }

  if (!stories.length) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center text-white">
        No active stories
      </div>
    );
  }

  const media = stories[index]?.story_media?.[0];
  if (!media?.output_path) return null;

  const imageUrl =
    `${supabaseUrl}/storage/v1/object/public/persona-stories/${media.output_path}`;

  /* ---------------- UI ---------------- */

  return (

    <div
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => setPaused(true)}
      onMouseUp={() => setPaused(false)}
      onTouchStartCapture={() => setPaused(true)}
      onTouchEndCapture={() => setPaused(false)}
    >

      {/* Progress bars */}

      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">

        {stories.map((_, i) => {

          let width = "0%";

          if (i < index) width = "100%";
          if (i === index) width = `${progress}%`;

          return (

            <div
              key={i}
              className="h-1 flex-1 bg-white/30 rounded overflow-hidden"
            >

              <div
                className="h-full bg-white transition-all"
                style={{ width }}
              />

            </div>

          );

        })}

      </div>

      {/* Image */}

      <img
        src={imageUrl}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        alt=""
      />

      {/* Close */}

      <button
        onClick={() => router.back()}
        className="absolute top-6 right-6 text-white text-2xl z-20"
      >
        ✕
      </button>

      {/* Tap zones */}

      <div
        className="absolute left-0 top-0 h-full w-1/2"
        onClick={prevStory}
      />

      <div
        className="absolute right-0 top-0 h-full w-1/2"
        onClick={nextStory}
      />

    </div>

  );
}