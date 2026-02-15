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
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-500">
        Profile not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* TOP BAR */}
      <div className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 px-6 py-4 flex items-center gap-4 z-50">
        <Link href="/feed" className="text-xl">
          ←
        </Link>
        <span className="font-semibold">@{profile.username}</span>
      </div>

      <div className="pt-24 px-6 max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">

          <img
            src={profile.avatar_url}
            className="w-36 h-36 rounded-full object-cover"
          />

          <div className="flex-1 text-center md:text-left">

            {/* STATS */}
            <div className="flex justify-center md:justify-start gap-10 mb-6">

              <div className="text-center">
                <div className="font-semibold text-lg">
                  {posts.length}
                </div>
                <div className="text-gray-500 text-sm">
                  Posts
                </div>
              </div>

              <div className="text-center">
                <div className="font-semibold text-lg">
                  {followersCount}
                </div>
                <div className="text-gray-500 text-sm">
                  Followers
                </div>
              </div>

              <div className="text-center">
                <div className="font-semibold text-lg">
                  {followingCount}
                </div>
                <div className="text-gray-500 text-sm">
                  Following
                </div>
              </div>

            </div>

            {/* BIO */}
            <div className="mb-6 text-gray-300 text-sm max-w-md">
              {profile.bio}
            </div>

            {/* FOLLOW BUTTON */}
            {viewerId && viewerId !== profile.id && (
              <button
                onClick={toggleFollow}
                className={`px-8 py-2 rounded-full font-medium transition ${
                  isFollowing
                    ? "bg-gray-800 text-white border border-gray-700"
                    : "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-black"
                }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}

          </div>

        </div>

        {/* POSTS GRID */}
        <div className="grid grid-cols-3 gap-1 md:gap-3">

          {posts.map((post) => (
            <div
              key={post.id}
              className="aspect-square overflow-hidden"
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
