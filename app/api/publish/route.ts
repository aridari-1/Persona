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

    const body = await req.json();

    const output_path: string = body.output_path;
    const prompt: string | null = body.prompt ?? null;
    const caption: string | null = body.caption ?? null;
    const visibility: string = body.visibility ?? "public";

    if (!output_path) {
      return NextResponse.json(
        { error: "Missing image path" },
        { status: 400 }
      );
    }

    /* -----------------------------
       VALIDATION
    ----------------------------- */

    if (caption && caption.length > 2000) {
      return NextResponse.json(
        { error: "Caption too long" },
        { status: 400 }
      );
    }

    const allowedVisibility = ["public", "followers", "private"];

    if (!allowedVisibility.includes(visibility)) {
      return NextResponse.json(
        { error: "Invalid visibility" },
        { status: 400 }
      );
    }

    /* -----------------------------
       CREATE POST
    ----------------------------- */

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        caption,
        prompt,
        visibility
      })
      .select("id")
      .single();

    if (postError || !post) {

      console.error("POST CREATE ERROR:", postError);

      return NextResponse.json(
        { error: "Failed to create post" },
        { status: 500 }
      );

    }

    /* -----------------------------
       INSERT MEDIA
    ----------------------------- */

    const { error: mediaError } = await supabase
      .from("post_media")
      .insert({
        post_id: post.id,
        media_type: "image",
        output_path
      });

    if (mediaError) {

      console.error("MEDIA INSERT ERROR:", mediaError);

      // rollback post to prevent broken post
      await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      return NextResponse.json(
        { error: "Failed to attach media" },
        { status: 500 }
      );

    }

    /* -----------------------------
       SUCCESS
    ----------------------------- */

    return NextResponse.json({
      success: true,
      post_id: post.id
    });

  } catch (err: any) {

    console.error("PUBLISH ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );

  }

}
