import { NextResponse } from "next/server";
import { supabaseWithToken } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {

    const auth = req.headers.get("Authorization") || "";

    if (!auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");
    const supabase = supabaseWithToken(token);

    const { data: userRes } = await supabase.auth.getUser();
    const currentUser = userRes?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Missing targetUserId" },
        { status: 400 }
      );
    }

    if (targetUserId === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    // ===============================
    // CHECK IF CONVERSATION EXISTS
    // ===============================

    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUser.id);

    if (existing && existing.length) {

      const conversationIds = existing.map((c) => c.conversation_id);

      const { data: otherSide } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .eq("user_id", targetUserId);

      if (otherSide && otherSide.length) {

        return NextResponse.json({
          conversation_id: otherSide[0].conversation_id,
          existing: true,
        });

      }

    }

    // ===============================
    // CREATE CONVERSATION
    // ===============================

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({})
      .select("id")
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: convError?.message || "Conversation creation failed" },
        { status: 500 }
      );
    }

    const conversationId = conversation.id;

    // ===============================
    // ADD PARTICIPANTS
    // ===============================

    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert([
        {
          conversation_id: conversationId,
          user_id: currentUser.id,
        },
        {
          conversation_id: conversationId,
          user_id: targetUserId,
        },
      ]);

    if (partError) {
      return NextResponse.json(
        { error: partError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversation_id: conversationId,
      existing: false,
    });

  } catch (err: any) {

    console.error("START CONVERSATION ERROR:", err);

    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );

  }
}