"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ConversationProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface Conversation {
  id: string;
  profiles: ConversationProfile[];
}

export default function MessagesPage() {

  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setLoading(false);
      return;
    }

    await fetchConversations(user.id);

  };

  const fetchConversations = async (userId: string) => {

    setLoading(true);

    // Step 1 — get conversation IDs the user belongs to
    const { data: myConversations, error: convError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (convError) {
      console.error("Conversation fetch error:", convError);
      setLoading(false);
      return;
    }

    if (!myConversations || myConversations.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const conversationIds = myConversations.map(
      (c) => c.conversation_id
    );

    // Step 2 — fetch ALL participants of those conversations
    const { data, error } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .in("conversation_id", conversationIds);

    if (error) {
      console.error("Participants fetch error:", error);
      setLoading(false);
      return;
    }

    const grouped: Record<string, Conversation> = {};

    data?.forEach((row: any) => {

      if (!grouped[row.conversation_id]) {
        grouped[row.conversation_id] = {
          id: row.conversation_id,
          profiles: [],
        };
      }

      const profile = Array.isArray(row.profiles)
        ? row.profiles[0]
        : row.profiles;

      if (profile) {
        grouped[row.conversation_id].profiles.push(profile);
      }

    });

    // Remove current user from participants list
    const filtered = Object.values(grouped)
      .map((conv) => ({
        ...conv,
        profiles: conv.profiles.filter((p) => p.id !== userId),
      }))
      .filter((conv) => conv.profiles.length > 0);

    setConversations(filtered);
    setLoading(false);

  };

  if (loading) {

    return (
      <div className="max-w-xl mx-auto px-4 pb-24">

        <h1 className="text-2xl font-bold my-6">
          Messages
        </h1>

        <div className="text-sm text-gray-500">
          Loading conversations...
        </div>

      </div>
    );

  }

  return (

    <div className="max-w-xl mx-auto px-4 pb-24">

      <h1 className="text-2xl font-bold my-6">
        Messages
      </h1>

      <div className="space-y-3">

        {conversations.length === 0 && (

          <div className="text-sm text-gray-500 bg-[#111] border border-gray-800 rounded-xl p-4">
            No conversations yet.
          </div>

        )}

        {conversations.map((conv) => {

          const user = conv.profiles[0];

          if (!user) return null;

          const avatar =
            user.avatar_url ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`;

          return (

            <div
              key={conv.id}
              onClick={() => router.push(`/messages/${conv.id}`)}
              className="flex items-center space-x-3 px-4 py-3 bg-[#111] rounded-xl cursor-pointer hover:bg-[#161616] transition"
            >

              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0f0f0f]">

                <Image
                  src={avatar}
                  alt={user.username}
                  width={40}
                  height={40}
                  className="object-cover"
                  unoptimized
                />

              </div>

              <div className="min-w-0 flex flex-col">

                <p className="font-medium text-sm truncate">
                  @{user.username}
                </p>

                <p className="text-xs text-gray-500">
                  Tap to chat
                </p>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

}
