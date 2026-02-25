"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface Post {
  id: string;
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
  const [hasActiveStory, setHasActiveStory] = useState(false);
  const [loading, setLoading] = useState(true);

  // NEW: follow system states
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameParam]);

  const fetchProfile = async () => {
    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    // If route is /profile/me, show current user profile like before
    const viewingMe = usernameParam === "me" || !usernameParam;

    // Fetch profile (by username when not "me", else by id)
    const profileQuery = supabase.from("profiles").select("*");

    const { data: profileData } = viewingMe
      ? await profileQuery.eq("id", user.id).single()
      : await profileQuery.eq("username", usernameParam).single();

    if (!profileData) {
      setProfile(null);
      setPosts([]);
      setHasActiveStory(false);
      setFollowersCount(0);
      setFollowingCount(0);
      setIsFollowing(false);
      setIsOwnProfile(false);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const own = profileData.id === user.id;
    setIsOwnProfile(own);

    // Fetch posts for the viewed profile
    const { data: postData } = await supabase
      .from("posts")
      .select(`
        id,
        post_media (
          output_path
        )
      `)
      .eq("user_id", profileData.id)
      .order("created_at", { ascending: false });

    setPosts(postData || []);

    // Check if active story exists for viewed profile
    const { data: storyData } = await supabase
      .from("stories")
      .select("id")
      .eq("user_id", profileData.id)
      .gt("expires_at", new Date().toISOString());

    setHasActiveStory((storyData?.length || 0) > 0);

    // NEW: follower + following counts
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileData.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileData.id),
    ]);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);

    // NEW: check if current user follows this profile (only if not own)
    if (!own) {
      const { data: followRow } = await supabase
        .from("follows")
        .select("follower_id, following_id")
        .eq("follower_id", user.id)
        .eq("following_id", profileData.id)
        .maybeSingle();

      setIsFollowing(!!followRow);
    } else {
      setIsFollowing(false);
    }

    setLoading(false);
  };

  // NEW: follow/unfollow actions
  const handleFollowToggle = async () => {
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;
    if (!user || !profile) return;

    // Prevent self-follow
    if (user.id === profile.id) return;

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);

      if (!error) {
        setIsFollowing(false);
        setFollowersCount((c) => Math.max(c - 1, 0));
      }
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: profile.id,
      });

      if (!error) {
        setIsFollowing(true);
        setFollowersCount((c) => c + 1);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="pb-28 px-4 max-w-2xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mt-8">

        {/* Avatar with Story Ring */}
        <div className="relative">

          <div
            className={`p-[3px] rounded-full ${
              hasActiveStory
                ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400"
                : "bg-gray-800"
            }`}
          >
            <div className="w-28 h-28 rounded-full overflow-hidden bg-black">
              {profile.avatar_url ? (
                <img src={`${profile.avatar_url}?v=${Date.now()}`} 
                 className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                  No Avatar
                </div>
              )}
            </div>
          </div>

          {hasActiveStory && (
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-xs px-2 py-1 rounded-full">
              Story
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex space-x-8 text-center">
          <div>
            <p className="text-lg font-semibold">{posts.length}</p>
            <p className="text-gray-400 text-sm">Posts</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{followersCount}</p>
            <p className="text-gray-400 text-sm">Followers</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{followingCount}</p>
            <p className="text-gray-400 text-sm">Following</p>
          </div>
        </div>
      </div>

      {/* NAME + BIO */}
      <div className="mt-6 space-y-2">
        <h1 className="text-xl font-bold">{profile.display_name}</h1>
        <p className="text-gray-400">@{profile.username}</p>

        {profile.bio && (
          <p className="text-sm text-gray-300 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* UPDATED: keep Edit Profile for own profile, Follow button for others */}
        {isOwnProfile ? (
          <button
            onClick={() => router.push("/profile/edit")}
            className="mt-4 border border-gray-700 w-full py-2 rounded-lg text-sm hover:bg-gray-900 transition"
          >
            Edit Profile
          </button>
        ) : (
          <button
            onClick={handleFollowToggle}
            className={`mt-4 w-full py-2 rounded-lg text-sm transition ${
              isFollowing
                ? "border border-gray-700 hover:bg-gray-900"
                : "neon-button text-black font-semibold hover:scale-[1.01]"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* POSTS GRID */}
      <div className="border-t border-gray-800 mt-10 pt-6">

        <div className="flex justify-center mb-4 text-gray-400 text-sm">
          Posts
        </div>

        <div className="grid grid-cols-3 gap-[2px]">
          {posts.map((post) => {
            const media = post.post_media?.[0];
            if (!media) return null;

            const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/persona-posts/${media.output_path}`;

            return (
              <div
                key={post.id}
                className="aspect-square overflow-hidden bg-black"
              >
                <img
                  src={imageUrl}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  alt=""
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}