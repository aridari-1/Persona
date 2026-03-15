import { NextResponse } from "next/server";
import { supabaseWithToken } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: Request) {

  try {

    /* -----------------------------
       AUTH
    ----------------------------- */

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const supabase = supabaseWithToken(token);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const currentUserId = user.id;

    /* -----------------------------
       BODY
    ----------------------------- */

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Missing targetUserId" },
        { status: 400 }
      );
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: "Cannot message yourself" },
        { status: 400 }
      );
    }

    /* -----------------------------
       CHECK EXISTING CONVERSATION
       (single optimized query)
    ----------------------------- */

    const { data: existing } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    if (existing?.length) {

      const conversationIds = existing.map(c => c.conversation_id);

      const { data: shared } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .eq("user_id", targetUserId)
        .limit(1)
        .maybeSingle();

      if (shared) {

        return NextResponse.json({
          conversation_id: shared.conversation_id,
          existing: true
        });

      }

    }

    /* -----------------------------
       CREATE CONVERSATION
    ----------------------------- */

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({})
      .select("id")
      .single();

    if (convError || !conversation) {

      console.error("CONVERSATION CREATE ERROR:", convError);

      return NextResponse.json(
        { error: "Conversation creation failed" },
        { status: 500 }
      );

    }

    const conversationId = conversation.id;

    /* -----------------------------
       INSERT PARTICIPANTS
    ----------------------------- */

    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert([
        {
          conversation_id: conversationId,
          user_id: currentUserId
        },
        {
          conversation_id: conversationId,
          user_id: targetUserId
        }
      ]);

    if (partError) {

      console.error("PARTICIPANT INSERT ERROR:", partError);

      return NextResponse.json(
        { error: "Failed to add participants" },
        { status: 500 }
      );

    }

    /* -----------------------------
       RESPONSE
    ----------------------------- */

    return NextResponse.json({
      conversation_id: conversationId,
      existing: false
    });

  } catch (err: any) {

    console.error("START CONVERSATION ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );

  }

}
