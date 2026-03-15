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

  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  const router = useRouter();

  const [stories, setStories] = useState<Story[]>([]);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    fetchStories();
  }, [userId]);

  useEffect(() => {

    if (!stories.length || !loaded) return;

    const timer = setTimeout(() => {

      if (index < stories.length - 1) {
        setIndex(prev => prev + 1);
      } else {
        router.back();
      }

    }, 5000);

    return () => clearTimeout(timer);

  }, [index, stories, loaded]);

  useEffect(() => {
    setLoaded(false);
  }, [index]);

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

  let cleanPath = media.output_path;

  if (cleanPath.includes("/posts/")) {
    cleanPath = cleanPath.replace("/posts/", "/stories/");
  }

  const imageUrl =
    `${supabaseUrl}/storage/v1/object/public/persona-stories/${cleanPath}`;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">

      {/* Progress bars */}

      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-20">

        {stories.map((_, i) => (

          <div
            key={i}
            className="h-1 flex-1 bg-white/30 rounded overflow-hidden"
          >
            {i === index && (
              <div className="h-full bg-white animate-[storyProgress_5s_linear]" />
            )}

            {i < index && (
              <div className="h-full bg-white" />
            )}
          </div>

        ))}

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
        onClick={() => setIndex(prev => Math.max(0, prev - 1))}
      />

      <div
        className="absolute right-0 top-0 h-full w-1/2"
        onClick={() =>
          index < stories.length - 1
            ? setIndex(prev => prev + 1)
            : router.back()
        }
      />

    </div>
  );
}