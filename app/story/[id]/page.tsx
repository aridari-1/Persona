"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

type Story = {
  id: string;
  media_url: string;
  caption: string;
  profiles: {
    username: string;
    avatar_url: string;
  } | null;
};

export default function StoryViewer() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStory = async () => {
      const now = new Date().toISOString();

      const { data } = await supabase
        .from("posts")
        .select(`
          id,
          media_url,
          caption,
          expires_at,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq("id", storyId)
        .eq("type", "story")
        .gt("expires_at", now)
        .single();

      if (data) {
        const normalized: Story = {
          ...data,
          profiles: (data as any).profiles?.[0] || null,
        };

        setStory(normalized);
      }

      setLoading(false);
    };

    loadStory();
  }, [storyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-500">
        Story expired or not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Top Bar */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3">
          {story.profiles && (
            <>
              <img
                src={story.profiles.avatar_url}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm">
                @{story.profiles.username}
              </span>
            </>
          )}
        </div>

        <button
          onClick={() => router.back()}
          className="text-white text-lg"
        >
          ✕
        </button>
      </div>

      {/* Story Content */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src={story.media_url}
          className="max-h-[90vh] object-contain"
        />
      </div>

      {/* Caption */}
      {story.caption && (
        <div className="p-4 text-sm text-gray-300 text-center">
          {story.caption}
        </div>
      )}

    </div>
  );
}
