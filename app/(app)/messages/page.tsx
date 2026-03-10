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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) return;

    await fetchConversations(user.id);
  };

  const fetchConversations = async (userId: string) => {
    const { data, error } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `);

    if (error || !data) {
      console.error("Conversation fetch error:", error);
      return;
    }

    const grouped: Record<string, Conversation> = {};

    data.forEach((row: any) => {
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

    // remove current user so only the other participant shows
    const filteredConversations = Object.values(grouped)
      .map((conv) => ({
        ...conv,
        profiles: conv.profiles.filter((p) => p.id !== userId),
      }))
      .filter((conv) => conv.profiles.length > 0);

    setConversations(filteredConversations);
  };

  return (
    <div className="max-w-xl mx-auto px-4 pb-24">

      <h1 className="text-2xl font-bold my-6">
        Messages
      </h1>

      <div className="space-y-3">

        {conversations.length === 0 && (
          <div className="text-sm text-gray-500">
            No conversations yet.
          </div>
        )}

        {conversations.map((conv) => {

          const user = conv.profiles[0];

          return (
            <div
              key={conv.id}
              onClick={() => router.push(`/messages/${conv.id}`)}
              className="flex items-center space-x-3 px-3 py-2 bg-[#111] rounded-xl cursor-pointer hover:bg-[#161616] transition"
            >

              {/* Avatar */}
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#0f0f0f] shrink-0">

                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.username}
                    width={24}
                    height={24}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-500">
                    ?
                  </div>
                )}

              </div>

              {/* Username */}
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  @{user?.username}
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