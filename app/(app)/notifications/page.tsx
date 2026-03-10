"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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

export default function NotificationsPage() {

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {

    setLoading(true);

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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notification fetch error:", error);
      setLoading(false);
      return;
    }

    setNotifications((data || []) as NotificationItem[]);
    setLoading(false);

  };

  const markAllAsRead = async () => {

    await supabase
      .from("notifications")
      .update({ is_read: true })
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
    <div className="pb-24 px-4 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between mt-6">

        <h1 className="text-2xl font-bold">
          Notifications
        </h1>

        <button
          onClick={markAllAsRead}
          className="text-sm text-gray-400 hover:text-white"
        >
          Mark all as read
        </button>

      </div>

      {/* Notifications List */}
      <div className="space-y-3">

        {notifications.length === 0 && (

          <div className="text-gray-500 text-sm">
            No notifications yet.
          </div>

        )}

        {notifications.map((item) => {

          const actor = normalizeProfile(item.actor);

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 flex items-center justify-between ${
                item.is_read
                  ? "border-gray-800 bg-[#111]"
                  : "border-purple-700 bg-[#15111d]"
              }`}
            >

              <div className="flex items-center space-x-3">

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden bg-black">

                  {actor?.avatar_url && (

                    <img
                      src={actor.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />

                  )}

                </div>

                {/* Text */}
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
                    {new Date(item.created_at).toLocaleString()}
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