"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatPage() {

  const { conversationId } = useParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function init() {

    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) return;

    setUserId(user.id);

    await fetchOtherUser(user.id);
    await fetchMessages();

    const channel = subscribeMessages();

    return () => {
      supabase.removeChannel(channel);
    };

  }

  async function fetchOtherUser(currentUserId: string) {

    const { data } = await supabase
      .from("conversation_participants")
      .select(`
        user_id,
        profiles (
          avatar_url
        )
      `)
      .eq("conversation_id", conversationId);

    if (!data) return;

    const other = data.find((p) => p.user_id !== currentUserId);

    if (other && Array.isArray(other.profiles)) {
      setOtherAvatar(other.profiles[0]?.avatar_url || null);
    }

  }

  async function fetchMessages() {

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(50);

    setMessages(data || []);

  }

  function subscribeMessages() {

    return supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {

          setMessages((prev) => {

            if (prev.some((m) => m.id === payload.new.id)) {
              return prev;
            }

            return [...prev, payload.new as Message];

          });

        }
      )
      .subscribe();

  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }

  async function sendMessage() {

    if (!text.trim()) return;

    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) return;

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: text,
    });

    setText("");

  }

  return (

    <div className="flex flex-col h-screen bg-black text-white">

      {/* HEADER */}
      <div className="px-4 py-3 border-b border-[#1a1a1a] text-center text-sm font-semibold">
        Conversation
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">

        {messages.map((msg) => {

          const isMine = msg.sender_id === userId;

          return (

            <div
              key={msg.id}
              className={`flex items-end gap-1.5 ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >

              {!isMine && (
                <div className="w-6 h-6 rounded-full overflow-hidden bg-[#111] shrink-0">
                  {otherAvatar && (
                    <Image
                      src={otherAvatar}
                      alt="avatar"
                      width={24}
                      height={24}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  )}
                </div>
              )}

              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                  isMine
                    ? "bg-white text-black"
                    : "bg-[#1a1a1a] text-white"
                }`}
              >

                {msg.content}

                <div className="text-[10px] text-gray-400 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

              </div>

            </div>

          );

        })}

        <div ref={bottomRef} />

      </div>

      {/* INPUT */}
      <div className="border-t border-[#1a1a1a] p-4 flex space-x-3">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Send a message..."
          className="flex-1 bg-[#111] px-4 py-2 rounded-full text-sm outline-none border border-[#222] focus:border-purple-500 transition placeholder-gray-500 !text-white"
        />

        <button
          onClick={sendMessage}
          className="px-5 py-2 bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition"
        >
          Send
        </button>

      </div>

    </div>

  );

}