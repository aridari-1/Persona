"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import LikeButton from "@/components/posts/LikeButton";
import Image from "next/image";

const PAGE_SIZE = 15;

interface Profile {
  username: string;
  avatar_url: string | null;
}

interface StoryUser {
  user_id: string;
  profiles: Profile | Profile[] | null;
}

interface Post {
  id: string;
  caption: string | null;
  created_at: string;
  like_count: number;
  post_media: {
    output_path: string;
  }[];
  profiles: Profile | Profile[] | null;
}

export default function FeedPage() {
  const [stories, setStories] = useState<StoryUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const normalizeProfile = (profile: any): Profile | null => {
    if (!profile) return null;
    if (Array.isArray(profile)) return profile[0] || null;
    return profile;
  };

  useEffect(() => {
    fetchInitialFeed();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);

    return () => observer.disconnect();
  }, [posts]);

  const fetchInitialFeed = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    setCurrentUserId(user.id);

    const { data: followingData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds =
      followingData?.map((f) => f.following_id) || [];

    const feedUserIds = [...followingIds, user.id];

    // STORIES
    const { data: storiesData } = await supabase
      .from("stories")
      .select(`
        user_id,
        profiles:profiles!stories_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .in("user_id", feedUserIds)
      .gt("expires_at", new Date().toISOString());

    const uniqueStories = Array.from(
      new Map(
        (storiesData || []).map((story) => [story.user_id, story])
      ).values()
    );

    setStories(uniqueStories as StoryUser[]);

    // POSTS
    const { data: postsData } = await supabase
      .from("posts")
      .select(`
        id,
        caption,
        created_at,
        like_count,
        profiles:profiles!posts_user_id_fkey (
          username,
          avatar_url
        ),
        post_media (
          output_path
        )
      `)
      .in("user_id", feedUserIds)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    const initialPosts = (postsData as Post[]) || [];

    setPosts(initialPosts);
    setHasMore(initialPosts.length === PAGE_SIZE);

    if (initialPosts.length) {
      const postIds = initialPosts.map((p) => p.id);

      const { data: likesData } = await supabase
        .from("likes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .in("target_id", postIds);

      setUserLikes(
        new Set(likesData?.map((l) => l.target_id) || [])
      );
    }

    setLoading(false);
  };

  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);

    const lastPost = posts[posts.length - 1];

    const { data } = await supabase
      .from("posts")
      .select(`
        id,
        caption,
        created_at,
        like_count,
        profiles:profiles!posts_user_id_fkey (
          username,
          avatar_url
        ),
        post_media (
          output_path
        )
      `)
      .lt("created_at", lastPost.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data?.length) {
      setPosts((prev) => [...prev, ...(data as Post[])]);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading feed...
      </div>
    );
  }

  return (
    <div className="bg-black text-white pb-24">

      {/* STORIES */}
      <div className="flex overflow-x-auto space-x-4 px-4 py-5 border-b border-[#1a1a1a]">
        {stories.map((story) => {
          const profile = normalizeProfile(story.profiles);

          return (
            <div
              key={story.user_id}
              onClick={() => router.push(`/stories/${story.user_id}`)}
              className="flex flex-col items-center space-y-2 cursor-pointer min-w-[70px]"
            >
              <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-purple-600 to-pink-600">
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                  {profile?.avatar_url && (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  )}
                </div>
              </div>

              <span className="text-[11px] text-gray-400 truncate w-16 text-center">
                {profile?.username || "user"}
              </span>
            </div>
          );
        })}
      </div>

      {/* POSTS */}
      <div className="space-y-10">
        {posts.map((post, index) => {
          const media = post.post_media?.[0];
          const profile = normalizeProfile(post.profiles);
          if (!media) return null;

          const imageUrl = `${supabaseUrl}/storage/v1/object/public/persona-posts/${media.output_path}`;
          const hasLiked = userLikes.has(post.id);

          return (
            <div key={post.id} className="space-y-3">

              {/* HEADER */}
              <div className="flex items-center space-x-3 px-4">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0f0f0f]">
                  {profile?.avatar_url && (
                    <Image
                      src={profile.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  )}
                </div>

                <span className="text-[13px] font-medium">
                  {profile?.username || "user"}
                </span>
              </div>

              {/* IMAGE */}
              <Image
                src={imageUrl}
                alt=""
                width={1024}
                height={1024}
                priority={index === 0}
                className="w-full object-cover"
                sizes="(max-width:768px) 100vw, 600px"
              />

              {/* ACTION */}
              <div className="px-4">
                {currentUserId && (
                  <LikeButton
                    postId={post.id}
                    initialLiked={hasLiked}
                    initialCount={post.like_count || 0}
                    userId={currentUserId}
                  />
                )}
              </div>

              {/* CAPTION */}
              {post.caption && (
                <div className="px-4 text-[14px] text-gray-300">
                  {post.caption}
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* INFINITE SCROLL TRIGGER */}
      {hasMore && (
        <div
          ref={loaderRef}
          className="h-16 flex items-center justify-center"
        >
          {loadingMore && (
            <span className="text-gray-500 text-sm">
              Loading...
            </span>
          )}
        </div>
      )}

    </div>
  );
}