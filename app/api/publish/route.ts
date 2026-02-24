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

    const { output_path, prompt, caption, visibility } = await req.json();

    if (!output_path) {
      return NextResponse.json({ error: "Missing image path" }, { status: 400 });
    }

    // 1️⃣ Insert Post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        caption,
        prompt,
        visibility: visibility || "public",
      })
      .select()
      .single();

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    // 2️⃣ Insert Media
    const { error: mediaError } = await supabase
      .from("post_media")
      .insert({
        post_id: post.id,
        media_type: "image",
        output_path: output_path,
      });

    if (mediaError) {
      return NextResponse.json({ error: mediaError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("PUBLISH ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}