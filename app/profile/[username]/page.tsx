"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
};

type Post = {
  id: string;
  media_url: string;
};

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) setViewerId(user.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: postsData } = await supabase
        .from("posts")
        .select("id, media_url")
        .eq("user_id", profileData.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (postsData) setPosts(postsData);

      const { count: followers } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileData.id);

      setFollowersCount(followers || 0);

      const { count: following } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileData.id);

      setFollowingCount(following || 0);

      if (user && user.id !== profileData.id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", profileData.id)
          .single();

        if (followData) setIsFollowing(true);
      }

      setLoading(false);
    };

    loadProfile();
  }, [username]);

  const toggleFollow = async () => {
    if (!viewerId || !profile) return;

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", viewerId)
        .eq("following_id", profile.id);

      setIsFollowing(false);
      setFollowersCount((prev) => prev - 1);
    } else {
      await supabase.from("follows").insert({
        follower_id: viewerId,
        following_id: profile.id,
      });

      setIsFollowing(true);
      setFollowersCount((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black text-gray-400">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-dvh flex items-center justify-center bg-black text-gray-500">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* 🔝 TOP BAR */}
      <div className="sticky top-0 bg-black border-b border-gray-800 px-4 py-4 flex items-center gap-4 z-50">
        <Link href="/feed" className="text-lg hover:opacity-70 transition">
          ←
        </Link>
        <span className="font-semibold text-sm tracking-wide">
          @{profile.username}
        </span>
      </div>

      <div className="px-5 pt-8 max-w-4xl mx-auto">

        {/* HEADER SECTION */}
        <div className="flex items-center justify-between mb-6">

          {/* Smaller Avatar */}
          <img
            src={profile.avatar_url}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border border-gray-700"
          />

          {/* Stats */}
          <div className="flex flex-1 justify-around text-center">

            <div>
              <div className="font-semibold text-lg">
                {posts.length}
              </div>
              <div className="text-gray-500 text-xs">
                Posts
              </div>
            </div>

            <div>
              <div className="font-semibold text-lg">
                {followersCount}
              </div>
              <div className="text-gray-500 text-xs">
                Followers
              </div>
            </div>

            <div>
              <div className="font-semibold text-lg">
                {followingCount}
              </div>
              <div className="text-gray-500 text-xs">
                Following
              </div>
            </div>

          </div>
        </div>

        {/* BIO SECTION */}
        <div className="mb-6">
          <div className="font-semibold text-sm">
            @{profile.username}
          </div>
          <div className="text-gray-400 text-sm mt-1 leading-relaxed">
            {profile.bio}
          </div>
        </div>

        {/* FOLLOW BUTTON */}
        {viewerId && viewerId !== profile.id && (
          <button
            onClick={toggleFollow}
            className={`w-full py-2 rounded-md text-sm font-medium transition mb-6 ${
              isFollowing
                ? "bg-gray-800 text-white border border-gray-700"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}

        {/* Divider */}
        <div className="border-t border-gray-800 mb-4"></div>

        {/* POSTS GRID (Instagram Style) */}
        <div className="grid grid-cols-3 gap-[2px] md:gap-2">

          {posts.map((post) => (
            <div
              key={post.id}
              className="aspect-square overflow-hidden bg-gray-900"
            >
              <img
                src={post.media_url}
                className="w-full h-full object-cover hover:scale-105 transition duration-300"
              />
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}
