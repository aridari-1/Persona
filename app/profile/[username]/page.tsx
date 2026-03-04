"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";

const PAGE_SIZE = 18;

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Post {
  id: string;
  created_at: string;
  post_media: {
    output_path: string;
  }[];
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const usernameParam = (params?.username as string) || "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [usernameParam]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && profile && !loadingMore) {
          loadMorePosts(profile.id);
        }
      },
      { rootMargin: "500px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [profile, hasMore, loadingMore]);

  const fetchProfile = async () => {
    setLoading(true);
    setPosts([]);
    setHasMore(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const viewingMe = usernameParam === "me" || !usernameParam;

    const { data: profileData } = viewingMe
      ? await supabase.from("profiles").select("*").eq("id", user.id).single()
      : await supabase.from("profiles").select("*").eq("username", usernameParam).single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const own = profileData.id === user.id;
    setIsOwnProfile(own);

    await loadInitialPosts(profileData.id);

    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "estimated", head: true })
        .eq("following_id", profileData.id),

      supabase
        .from("follows")
        .select("*", { count: "estimated", head: true })
        .eq("follower_id", profileData.id),
    ]);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);

    if (!own) {
      const { data: followRow } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", profileData.id)
        .maybeSingle();

      setIsFollowing(!!followRow);
    }

    setLoading(false);
  };

  const loadInitialPosts = async (userId: string) => {
    const { data } = await supabase
      .from("posts")
      .select(`
        id,
        created_at,
        post_media:post_media (
          output_path
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    console.log("PROFILE POSTS:", data);

    setPosts((data as Post[]) || []);
    setHasMore((data?.length || 0) === PAGE_SIZE);
  };

  const loadMorePosts = async (userId: string) => {
    if (loadingMore || !hasMore) return;

    const lastPost = posts[posts.length - 1];
    if (!lastPost) return;

    setLoadingMore(true);

    const { data } = await supabase
      .from("posts")
      .select(`
        id,
        created_at,
        post_media:post_media (
          output_path
        )
      `)
      .eq("user_id", userId)
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

  const handleFollowToggle = async () => {
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;
    if (!user || !profile) return;

    if (user.id === profile.id) return;

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);

      setIsFollowing(false);
      setFollowersCount((c) => Math.max(c - 1, 0));
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: profile.id,
      });

      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="pb-28 max-w-2xl mx-auto">

      {/* HEADER */}
      <div className="px-6 pt-10 space-y-6">

        <div className="flex items-center justify-between">

          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0f0f0f]">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                alt=""
              />
            )}
          </div>

          {/* Stats */}
          <div className="flex space-x-10 text-center">
            <div>
              <p className="text-[15px] font-medium">{posts.length}</p>
              <p className="text-[11px] text-gray-500">Posts</p>
            </div>

            <div>
              <p className="text-[15px] font-medium">{followersCount}</p>
              <p className="text-[11px] text-gray-500">Followers</p>
            </div>

            <div>
              <p className="text-[15px] font-medium">{followingCount}</p>
              <p className="text-[11px] text-gray-500">Following</p>
            </div>
          </div>

        </div>

        {/* Name + Bio */}
        <div className="space-y-1">
          <h1 className="text-[16px] font-semibold">{profile.display_name}</h1>

          <p className="text-[13px] text-gray-500">
            @{profile.username}
          </p>

          {profile.bio && (
            <p className="text-[14px] text-gray-300 mt-2 leading-relaxed">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Action Button */}
        {isOwnProfile ? (
          <button
            onClick={() => router.push("/profile/edit")}
            className="w-full border border-[#1e1e1e] py-2.5 rounded-lg text-[13px] hover:bg-[#141414]"
          >
            Edit Profile
          </button>
        ) : (
          <button
            onClick={handleFollowToggle}
            className={`w-full py-2.5 rounded-lg text-[13px] ${
              isFollowing
                ? "border border-[#1e1e1e] hover:bg-[#141414]"
                : "bg-white text-black hover:opacity-90"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}

      </div>

      {/* Divider */}
      <div className="border-t border-[#1a1a1a] mt-10" />

      {/* POSTS GRID */}
      <div className="grid grid-cols-3 gap-[2px] mt-6">
        {posts.map((post) => {
          const media = post.post_media?.[0];
          if (!media) return null;

          const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/persona-posts/${media.output_path}`;

          return (
            <div key={post.id} className="aspect-square overflow-hidden bg-black">
              <img
                src={imageUrl}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover hover:scale-[1.03] transition"
                alt=""
              />
            </div>
          );
        })}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={loadMoreRef} className="h-10" />

      {loadingMore && (
        <div className="flex justify-center py-6 text-gray-500">
          Loading more...
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div className="flex justify-center py-6 text-gray-600 text-sm">
          End of posts
        </div>
      )}

    </div>
  );
}