"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Story {
  id: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  }[];
}

interface Post {
  id: string;
  caption: string | null;
  created_at: string;
  post_media: {
    output_path: string;
  }[];
  profiles: {
    username: string;
    avatar_url: string | null;
  }[];
}

export default function FeedPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) {
      setLoading(false);
      return;
    }

    // 1️⃣ Get people the user follows
    const { data: followingData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds =
      followingData?.map((f) => f.following_id) || [];

    // Include own content (Instagram behavior)
    const feedUserIds = [...followingIds, user.id];

    // 2️⃣ Fetch active stories
    const { data: storiesData } = await supabase
      .from("stories")
      .select(`
        id,
        user_id,
        profiles (
          username,
          avatar_url
        )
      `)
      .in("user_id", feedUserIds)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    setStories(storiesData || []);

    // 3️⃣ Fetch posts
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        id,
        caption,
        created_at,
        profiles (
          username,
          avatar_url
        ),
        post_media (
          output_path
        )
      `)
      .in("user_id", feedUserIds)
      .order("created_at", { ascending: false });

    setPosts(postsData || []);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        Loading feed...
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6">

      {/* STORIES ROW */}
      <div className="flex overflow-x-auto space-x-4 px-4 pt-4">

        {stories.map((story) => {
          const profile = story.profiles?.[0];

          return (
            <div
              key={story.id}
              className="flex flex-col items-center space-y-2"
            >
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-pink-500">
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      ?
                    </div>
                  )}
                </div>
              </div>

              <span className="text-xs text-gray-400">
                {profile?.username || "user"}
              </span>
            </div>
          );
        })}

      </div>

      {/* POSTS FEED */}
      <div className="space-y-8 px-4">

        {posts.map((post) => {
          const media = post.post_media?.[0];
          const profile = post.profiles?.[0];

          if (!media) return null;

          const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/persona-posts/${media.output_path}`;

          return (
            <div key={post.id} className="bg-[#111] rounded-xl overflow-hidden">

              {/* Post Header */}
              <div className="flex items-center space-x-3 p-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-black">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      ?
                    </div>
                  )}
                </div>

                <span className="text-sm font-semibold">
                  {profile?.username || "user"}
                </span>
              </div>

              {/* Post Image */}
              <img
                src={imageUrl}
                className="w-full object-cover"
                alt=""
              />

              {/* Caption */}
              {post.caption && (
                <div className="p-4 text-sm text-gray-300">
                  {post.caption}
                </div>
              )}

            </div>
          );
        })}

      </div>

    </div>
  );
}