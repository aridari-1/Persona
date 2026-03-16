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
     INITIAL FEED
  ------------------------------ */

  const fetchInitialFeed = async () => {

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    setCurrentUserId(user.id);

    /* -------- FETCH STORIES -------- */

    const { data: storiesData } = await supabase
      .from("stories")
      .select(`
        id,
        user_id,
        profiles:profiles!stories_user_id_fkey (
          username,
          avatar_url
        )
      `)
      .gt("expires_at", new Date().toISOString());

    const { data: views } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", user.id);

    const viewedIds = new Set(views?.map((v) => v.story_id));

    const userStories: Record<string, StoryUser> = {};

    (storiesData || []).forEach((story: any) => {

      const unseen = !viewedIds.has(story.id);

      if (!userStories[story.user_id]) {

        userStories[story.user_id] = {
          user_id: story.user_id,
          profiles: story.profiles,
          unseen,
        };

      } else if (unseen) {

        userStories[story.user_id].unseen = true;

      }

    });

    setStories(Object.values(userStories));

    /* -------- FETCH POSTS -------- */

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
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    const initialPosts =
      feedData?.map((row: any) => row.posts).filter(Boolean) || [];

    setPosts(initialPosts);
    setHasMore(initialPosts.length === PAGE_SIZE);

    /* -------- FETCH LIKES -------- */

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
     LOAD MORE POSTS
  ------------------------------ */

  const loadMorePosts = async () => {

    if (!hasMore || loadingMore) return;

    setLoadingMore(true);

    const lastPost = posts[posts.length - 1];

    const { data } = await supabase
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
      .eq("user_id", currentUserId)
      .lt("created_at", lastPost.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data?.length) {

      const newPosts =
        data.map((row: any) => row.posts).filter(Boolean) || [];

      setPosts((prev) => [...prev, ...newPosts]);
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

      {/* STORY VIEWER */}

      {activeStoryUser && (
        <StoryViewer
          userId={activeStoryUser}
          onClose={() => {
            setActiveStoryUser(null);
            fetchInitialFeed(); // refresh rings
          }}
        />
      )}

      {/* STORIES */}

      <div className="flex overflow-x-auto space-x-4 px-4 py-4 border-b border-[#1a1a1a]">

        {stories.map((story) => {

          const profile = normalizeProfile(story.profiles);

          const ring = story.unseen
            ? "bg-gradient-to-tr from-purple-600 to-pink-600"
            : "bg-gray-700";

          return (

            <div
              key={story.user_id}
              onClick={() => router.push(`/stories/${story.user_id}`)}
              className="flex flex-col items-center space-y-2 cursor-pointer min-w-[70px]"
            >

              <div className={`w-14 h-14 rounded-full p-[2px] ${ring}`}>

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

      {/* POSTS (unchanged) */}

      <div className="space-y-10">

        {posts.map((post, index) => {

          const media = post.post_media?.[0];
          const profile = normalizeProfile(post.profiles);

          if (!media) return null;

          const imageUrl =
            `${supabaseUrl}/storage/v1/object/public/persona-posts/${media.output_path}`;

          const hasLiked = userLikes.has(String(post.id));

          return (

            <div key={`${post.id}-${index}`} className="space-y-3">

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
                  className="text-[13px] font-medium cursor-pointer"
                >
                  {profile?.username || "user"}
                </span>

              </div>

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
                  sizes="(max-width:768px) 100vw, 600px"
                />

              </div>

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

              {post.caption && (

                <div className="px-4 text-[14px] text-gray-300">

                  <span
                    onClick={() => router.push(`/profile/${profile?.username}`)}
                    className="font-medium text-white mr-2 cursor-pointer"
                  >
                    {profile?.username}
                  </span>

                  {post.caption}

                </div>

              )}

            </div>

          );

        })}

      </div>

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
