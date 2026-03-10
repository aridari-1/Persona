"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

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

  }, [profile, hasMore, loadingMore]);

  async function fetchProfile() {

    setLoading(true);
    setPosts([]);

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

    const [{ count: followers }, { count: following }, { count: postTotal }] =
      await Promise.all([

        supabase
          .from("follows")
          .select("*", { count: "estimated", head: true })
          .eq("following_id", profileData.id),

        supabase
          .from("follows")
          .select("*", { count: "estimated", head: true })
          .eq("follower_id", profileData.id),

        supabase
          .from("posts")
          .select("*", { count: "estimated", head: true })
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

      {/* PROFILE HEADER */}

      <div className="px-6 pt-10 space-y-6">

        <div className="flex items-center justify-between">

          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#0f0f0f]">

            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="avatar"
                fill
                sizes="96px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                No Avatar
              </div>
            )}

          </div>

          <div className="flex space-x-10 text-center">

            <div>
              <p className="text-[16px] font-semibold">{postCount}</p>
              <p className="text-[11px] text-gray-500">Posts</p>
            </div>

            <div>
              <p className="text-[16px] font-semibold">{followersCount}</p>
              <p className="text-[11px] text-gray-500">Followers</p>
            </div>

            <div>
              <p className="text-[16px] font-semibold">{followingCount}</p>
              <p className="text-[11px] text-gray-500">Following</p>
            </div>

          </div>

        </div>

        <div className="space-y-1">

          <h1 className="text-[16px] font-semibold">{profile.display_name}</h1>

          <p className="text-[13px] text-gray-500">
            @{profile.username}
          </p>

          {profile.bio && (
            <p className="text-[14px] text-gray-300 mt-2">
              {profile.bio}
            </p>
          )}

        </div>

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
                ? "border border-[#1e1e1e]"
                : "bg-white text-black"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}

      </div>

      <div className="border-t border-[#1a1a1a] mt-10" />

      {/* POSTS GRID */}

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

      {!hasMore && posts.length > 0 && (
        <div className="flex justify-center py-6 text-gray-600 text-sm">
          End of posts
        </div>
      )}

    </div>

  );

}