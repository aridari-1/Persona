"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image"

type UserRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("Followers");

  useEffect(() => {
    loadPage();
  }, [username]);

  const loadPage = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const me = session?.user?.id ?? null;
    setCurrentUserId(me);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", username)
      .single();

    if (profileError || !profile) {
      setLoading(false);
      return;
    }

    setTargetProfileId(profile.id);
    setPageTitle(`${profile.username} · Followers`);

    const { data: followRows, error: followError } = await supabase
      .from("follows")
      .select(`
        follower_id,
        follower:profiles!follows_follower_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("following_id", profile.id)
      .order("created_at", { ascending: false });

    if (followError || !followRows) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const followerUsers = followRows
      .map((row: any) => row.follower)
      .filter(Boolean) as UserRow[];

    setUsers(followerUsers);

    if (me && followerUsers.length > 0) {
      const ids = followerUsers.map((u) => u.id);

      const { data: myFollowing } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", me)
        .in("following_id", ids);

      const map: Record<string, boolean> = {};
      (myFollowing || []).forEach((row: any) => {
        map[row.following_id] = true;
      });
      setFollowingMap(map);
    }

    setLoading(false);
  };

  const toggleFollow = async (userId: string) => {
    if (!currentUserId || currentUserId === userId) return;

    const isFollowing = !!followingMap[userId];

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);

      if (!error) {
        setFollowingMap((prev) => ({ ...prev, [userId]: false }));
      }
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: userId,
      });

      if (!error) {
        setFollowingMap((prev) => ({ ...prev, [userId]: true }));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-xl mx-auto">
          <h1 className="text-xl font-semibold mb-6">Followers</h1>
          <div className="text-sm text-gray-400">Loading followers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-28">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-white"
          >
            Back
          </button>
          <h1 className="text-xl font-semibold">Followers</h1>
        </div>

        {users.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-[#111] p-6 text-sm text-gray-400">
            No followers yet.
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((user) => {
              const isSelf = currentUserId === user.id;
              const isFollowing = !!followingMap[user.id];

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-800 bg-[#111] px-4 py-3"
                >
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 min-w-0"
                  >
   <div className="w-6 h-6 rounded-full overflow-hidden bg-[#0f0f0f] shrink-0">
  {user.avatar_url && (
    <Image
      src={user.avatar_url}
      alt={user.username}
      width={24}
      height={24}
      className="object-cover"
      unoptimized
    />
  )}
</div>

                    <div className="min-w-0">
                      <div className="font-medium truncate">{user.username}</div>
                      {user.display_name && (
                        <div className="text-sm text-gray-400 truncate">
                          {user.display_name}
                        </div>
                      )}
                    </div>
                  </Link>

                  {!isSelf && currentUserId && (
                    <button
                      onClick={() => toggleFollow(user.id)}
                      className={`ml-4 shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                        isFollowing
                          ? "border border-gray-700 text-white hover:bg-gray-900"
                          : "bg-white text-black hover:opacity-90"
                      }`}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}