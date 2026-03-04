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
    const user = userRes?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { output_path } = await req.json();

    if (!output_path) {
      return NextResponse.json(
        { error: "Missing story image path" },
        { status: 400 }
      );
    }

    // Stories expire in 24h
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 1️⃣ Create story container
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (storyError || !story) {
      return NextResponse.json(
        { error: storyError?.message || "Failed to create story" },
        { status: 500 }
      );
    }

    // 2️⃣ Insert media into story_media
    const { error: mediaError } = await supabase
      .from("story_media")
      .insert({
        story_id: story.id,
        media_type: "image",
        output_path: output_path,
      });

    if (mediaError) {
      return NextResponse.json(
        { error: mediaError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("PUBLISH STORY ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}