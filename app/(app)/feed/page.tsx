"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import LikeButton from "@/components/posts/LikeButton";
import StoryViewer from "@/components/stories/StoryViewer";
import Image from "next/image";

const PAGE_SIZE = 15;

interface Profile {
  username: string;
  avatar_url: string | null;
}

interface StoryUser {
  user_id: string;
  profiles: Profile | Profile[] | null;
  unseen: boolean;
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

  const router = useRouter();

  const [stories, setStories] = useState<StoryUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(true);

  const [activeStoryUser, setActiveStoryUser] = useState<string | null>(null);

  const loaderRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const normalizeProfile = (profile: any): Profile | null => {
    if (!profile) return null;
    if (Array.isArray(profile)) return profile[0] || null;
    return profile;
  };

  useEffect(() => {
    fetchInitialFeed();
  }, []);

  /* ------------------------------
     SAFE INFINITE SCROLL
  ------------------------------ */

  useEffect(() => {

    if (!loaderRef.current || !hasMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMorePosts();
        }
      },
      { rootMargin: "600px" }
    );

    observerRef.current.observe(loaderRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };

  }, [posts, hasMore]);

  /* ------------------------------
     FETCH FEED (MAIN FIX HERE)
  ------------------------------ */

  const fetchFeedPosts = async (userId: string) => {

    // 1️⃣ Try user_feed (fast system)
    const { data: feedData } = await supabase
      .from("user_feed")
      .select(`
        created_at,
        posts:post_id (
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
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    let result =
      feedData?.map((row: any) => row.posts).filter(Boolean) || [];

    // 2️⃣ FALLBACK if feed is broken (CRITICAL)
    if (!result.length) {

      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      const ids = [
        userId,
        ...(following?.map(f => f.following_id) || [])
      ];

      const { data: postsFallback } = await supabase
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
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      result = postsFallback || [];
    }

    return result;
  };

  /* ------------------------------
     INITIAL FEED
  ------------------------------ */

  const fetchInitialFeed = async () => {

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    setCurrentUserId(user.id);

    /* -------- POSTS -------- */

    const initialPosts = await fetchFeedPosts(user.id);

    setPosts(initialPosts);
    setHasMore(initialPosts.length === PAGE_SIZE);

    /* -------- LIKES -------- */

    if (initialPosts.length) {

      const postIds = initialPosts.map((p: Post) => p.id);

      const { data: likesData } = await supabase
        .from("likes")
        .select("target_id")
        .eq("user_id", user.id)
        .eq("target_type", "post")
        .in("target_id", postIds);

      setUserLikes(
        new Set(likesData?.map((l) => String(l.target_id)) || [])
      );
    }

    setLoading(false);
  };

  /* ------------------------------
     LOAD MORE (SAFE)
  ------------------------------ */

  const loadMorePosts = async () => {

    if (!hasMore || loadingMore || !posts.length) return;

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

      // remove duplicates
      const existingIds = new Set(posts.map(p => p.id));

      const newPosts = data.filter(p => !existingIds.has(p.id));

      setPosts(prev => [...prev, ...newPosts]);
      setHasMore(newPosts.length === PAGE_SIZE);

    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  };

  /* ------------------------------
     DOUBLE TAP LIKE
  ------------------------------ */

  const handleDoubleTap = (postId: string) => {

    if (!currentUserId) return;

    setUserLikes((prev) => {

      const updated = new Set(prev);

      if (!updated.has(postId)) {

        updated.add(postId);

        supabase.from("likes").insert({
          user_id: currentUserId,
          target_id: postId,
          target_type: "post",
        });

      }

      return updated;

    });

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

      <div className="space-y-10">

        {posts.map((post, index) => {

          const media = post.post_media?.[0];
          const profile = normalizeProfile(post.profiles);

          if (!media) return null;

          const imageUrl =
            `${supabaseUrl}/storage/v1/object/public/persona-posts/${media.output_path}`;

          const hasLiked = userLikes.has(String(post.id));

          return (

            <div key={post.id} className="space-y-3">

              {/* HEADER */}
              <div className="flex items-center space-x-3 px-4">

                <div
                  onClick={() => router.push(`/profile/${profile?.username}`)}
                  className="w-8 h-8 rounded-full overflow-hidden bg-[#0f0f0f] cursor-pointer"
                >
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

                <span
                  onClick={() => router.push(`/profile/${profile?.username}`)}
                  className="text-[13px] font-semibold cursor-pointer"
                >
                  {profile?.username || "user"}
                </span>

              </div>

              {/* IMAGE */}
              <div
                onDoubleClick={() => handleDoubleTap(post.id)}
                onClick={() => router.push(`/post/${post.id}`)}
              >
                <Image
                  src={imageUrl}
                  alt=""
                  width={1024}
                  height={1024}
                  priority={index === 0}
                  className="w-full object-cover"
                />
              </div>

              {/* LIKE */}
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

              {/* CAPTION FIX */}
              {post.caption && (

                <div className="px-4 text-[14px] leading-relaxed space-y-1">

                  <div
                    onClick={() => router.push(`/profile/${profile?.username}`)}
                    className="font-semibold text-white cursor-pointer"
                  >
                    {profile?.username}
                  </div>

                  <div className="text-gray-300">
                    {post.caption}
                  </div>

                </div>

              )}

            </div>

          );

        })}

      </div>

      {hasMore && (
        <div ref={loaderRef} className="h-16 flex items-center justify-center">
          {loadingMore && (
            <span className="text-gray-500 text-sm">Loading...</span>
          )}
        </div>
      )}

    </div>

  );

}