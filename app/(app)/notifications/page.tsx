"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  type: "follow" | "like";
  is_read: boolean;
  created_at: string;
  post_id: string | null;
  actor_id: string;
  actor: {
    username: string;
    avatar_url: string | null;
  }[] | null;
}

function normalizeProfile(profile: any) {
  if (!profile) return null;
  if (Array.isArray(profile)) return profile[0];
  return profile;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function NotificationsPage() {

  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {

    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(`
        id,
        type,
        is_read,
        created_at,
        post_id,
        actor_id,
        actor:profiles!notifications_actor_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Notification fetch error:", error);
      setLoading(false);
      return;
    }

    setNotifications((data || []) as NotificationItem[]);
    setLoading(false);

  };

  const markAllAsRead = async () => {

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );

  };

  if (loading) {

    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        Loading notifications...
      </div>
    );

  }

  return (

    <div className="pb-28 px-4 max-w-2xl mx-auto space-y-6">

      <div className="flex items-center justify-between mt-6">

        <h1 className="text-2xl font-bold">
          Notifications
        </h1>

        {notifications.length > 0 && (

          <button
            onClick={markAllAsRead}
            className="text-sm text-gray-400 hover:text-white"
          >
            Mark all as read
          </button>

        )}

      </div>

      <div className="space-y-3">

        {notifications.length === 0 && (

          <div className="text-gray-500 text-sm bg-[#111] border border-gray-800 rounded-xl p-6">
            No notifications yet.
          </div>

        )}

        {notifications.map((item) => {

          const actor = normalizeProfile(item.actor);

          const avatar =
            actor?.avatar_url ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${actor?.username}`;

          const handleClick = () => {

            if (item.type === "like" && item.post_id) {
              router.push(`/post/${item.post_id}`);
            }

            if (item.type === "follow" && actor) {
              router.push(`/profile/${actor.username}`);
            }

          };

          return (

            <div
              key={item.id}
              onClick={handleClick}
              className={`cursor-pointer rounded-xl border p-4 flex items-center justify-between transition ${
                item.is_read
                  ? "border-gray-800 bg-[#111]"
                  : "border-purple-700 bg-[#15111d]"
              }`}
            >

              <div className="flex items-center space-x-3">

                <div className="w-6 h-6 rounded-full overflow-hidden">

                  <Image
                    src={avatar}
                    alt=""
                    width={24}
                    height={24}
                    className="object-cover"
                  />

                </div>

                <div className="text-sm">

                  {item.type === "follow" && (
                    <p>
                      <span className="font-semibold">
                        @{actor?.username || "user"}
                      </span>{" "}
                      followed you
                    </p>
                  )}

                  {item.type === "like" && (
                    <p>
                      <span className="font-semibold">
                        @{actor?.username || "user"}
                      </span>{" "}
                      liked your post
                    </p>
                  )}

                  <p className="text-gray-500 text-xs mt-1">
                    {timeAgo(item.created_at)}
                  </p>

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}