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

    /* -----------------------------
       BODY
    ----------------------------- */

    const { output_path } = await req.json();

    if (!output_path) {
      return NextResponse.json(
        { error: "Missing story image path" },
        { status: 400 }
      );
    }

    /* -----------------------------
       BASIC VALIDATION
    ----------------------------- */

    if (typeof output_path !== "string" || output_path.length > 500) {
      return NextResponse.json(
        { error: "Invalid image path" },
        { status: 400 }
      );
    }

    // Optional safety check (prevents external URLs)
    if (output_path.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid storage path" },
        { status: 400 }
      );
    }

    /* -----------------------------
       EXPIRES IN 24 HOURS
    ----------------------------- */

    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    /* -----------------------------
       CREATE STORY
    ----------------------------- */

    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        expires_at: expiresAt
      })
      .select("id")
      .single();

    if (storyError || !story) {

      console.error("STORY CREATE ERROR:", storyError);

      return NextResponse.json(
        { error: "Failed to create story" },
        { status: 500 }
      );

    }

    /* -----------------------------
       INSERT MEDIA
    ----------------------------- */

    const { error: mediaError } = await supabase
      .from("story_media")
      .insert({
        story_id: story.id,
        media_type: "image",
        output_path
      });

    if (mediaError) {

      console.error("STORY MEDIA ERROR:", mediaError);

      // rollback story to avoid empty story containers
      await supabase
        .from("stories")
        .delete()
        .eq("id", story.id);

      return NextResponse.json(
        { error: "Failed to attach story media" },
        { status: 500 }
      );

    }

    /* -----------------------------
       SUCCESS
    ----------------------------- */

    return NextResponse.json({
      success: true,
      story_id: story.id
    });

  } catch (err: any) {

    console.error("PUBLISH STORY ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );

  }

}
