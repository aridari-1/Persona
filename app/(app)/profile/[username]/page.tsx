"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const PAGE_SIZE = 50;

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
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

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export default function ProfilePage() {

  const router = useRouter();
  const params = useParams();
  const usernameParam = (params?.username as string) || "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

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
      { rootMargin: "400px" }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();

  }, [posts.length, hasMore]);

  async function fetchProfile() {

    setLoading(true);
    setPosts([]);

    const { data: { user } } = await supabase.auth.getUser();

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

    const [{ count: followers }, { count: following }, { count: postTotal }] =
      await Promise.all([

        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profileData.id),

        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", profileData.id),

        supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profileData.id),

      ]);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
    setPostCount(postTotal || 0);

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

  }

  async function loadInitialPosts(userId: string) {

    const { data } = await supabase
      .from("posts")
      .select(`
        id,
        created_at,
        post_media (
          output_path
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    setPosts((data as Post[]) || []);
    setHasMore((data?.length || 0) === PAGE_SIZE);

  }

  async function loadMorePosts(userId: string) {

    if (loadingMore || !hasMore) return;

    const lastPost = posts[posts.length - 1];
    if (!lastPost) return;

    setLoadingMore(true);

    const { data } = await supabase
      .from("posts")
      .select(`
        id,
        created_at,
        post_media (
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

  }

  async function handleFollowToggle() {

    const { data: { user } } = await supabase.auth.getUser();

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

  }

  async function handleMessage() {

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    if (!token || !profile) return;

    const res = await fetch("/api/start-conversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        targetUserId: profile.id,
      }),
    });

    const result = await res.json();

    if (res.ok) {
      router.push(`/messages/${result.conversation_id}`);
    }

  }

  function handleShareProfile() {

    if (!profile) return;

    const url = `${window.location.origin}/profile/${profile.username}`;

    navigator.clipboard.writeText(url);

    alert("Profile link copied!");

  }

  if (loading) {

    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading profile...
      </div>
    );

  }

  if (!profile) return null;

  return (

    <div className="pb-28 max-w-2xl mx-auto">

      <div className="px-6 pt-10 space-y-5">

        <div className="flex items-center gap-6">

          <div className="w-24 h-24 rounded-full overflow-hidden bg-[#0f0f0f] shrink-0">

            <Image
              src={
                profile.avatar_url ||
                `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`
              }
              alt="avatar"
              width={96}
              height={96}
              className="object-cover w-full h-full"
              priority
            />

          </div>

          <div className="flex flex-1 justify-between text-center">

            <div>
              <p className="text-[16px] font-semibold">{formatNumber(postCount)}</p>
              <p className="text-[12px] text-gray-500">Posts</p>
            </div>

            <Link href={`/profile/${profile.username}/followers`}>
              <div className="cursor-pointer hover:text-white transition">
                <p className="text-[16px] font-semibold">{formatNumber(followersCount)}</p>
                <p className="text-[12px] text-gray-500">Followers</p>
              </div>
            </Link>

            <Link href={`/profile/${profile.username}/following`}>
              <div className="cursor-pointer hover:text-white transition">
                <p className="text-[16px] font-semibold">{formatNumber(followingCount)}</p>
                <p className="text-[12px] text-gray-500">Following</p>
              </div>
            </Link>

          </div>

        </div>

        <div className="space-y-1">

          <h1 className="text-[16px] font-semibold">
            {profile.display_name || profile.username}
          </h1>

          <p
            className="text-[13px] text-gray-500 cursor-pointer hover:text-white"
            onClick={() => router.push(`/profile/${profile.username}`)}
          >
            @{profile.username}
          </p>

          {profile.bio && (
            <p className="text-[14px] text-gray-300 leading-relaxed">
              {profile.bio}
            </p>
          )}

        </div>

        {isOwnProfile ? (

          <div className="flex gap-3">

            <button
              onClick={() => router.push("/profile/edit")}
              className="flex-1 border border-[#1e1e1e] py-2.5 rounded-lg text-[13px]"
            >
              Edit Profile
            </button>

            <button
              onClick={handleShareProfile}
              className="flex-1 border border-[#1e1e1e] py-2.5 rounded-lg text-[13px]"
            >
              Share Profile
            </button>

          </div>

        ) : (

          <div className="flex gap-3">

            <button
              onClick={handleFollowToggle}
              className={`flex-1 py-2.5 rounded-lg text-[13px] ${
                isFollowing
                  ? "border border-[#1e1e1e]"
                  : "bg-white text-black"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>

            <button
              onClick={handleMessage}
              className="flex-1 border border-[#1e1e1e] py-2.5 rounded-lg text-[13px]"
            >
              Message
            </button>

          </div>

        )}

      </div>

      <div className="border-t border-[#1a1a1a] mt-10" />

      <div className="grid grid-cols-3 gap-[2px] mt-6">

        {posts.map((post) => {

          const media = post.post_media?.[0];
          if (!media) return null;

          const imageUrl =
            `${supabaseUrl}/storage/v1/object/public/persona-posts/${media.output_path}`;

          return (

            <div
              key={post.id}
              onClick={() => router.push(`/post/${post.id}`)}
              className="relative aspect-square overflow-hidden bg-black cursor-pointer group"
            >

              <Image
                src={imageUrl}
                alt="post"
                fill
                sizes="33vw"
                className="object-cover group-hover:scale-[1.05] transition duration-300"
                loading="lazy"
                unoptimized
              />

            </div>

          );

        })}

      </div>

      <div ref={loadMoreRef} className="h-10" />

      {loadingMore && (
        <div className="flex justify-center py-6 text-gray-500">
          Loading more...
        </div>
      )}

    </div>

  );

}