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

    const { output_path, caption, prompt, visibility } = await req.json();

    if (!output_path) {
      return NextResponse.json({ error: "Missing image path" }, { status: 400 });
    }

    const { error } = await supabase
      .from("stories")
      .insert({
        user_id: user.id,
        caption,
        prompt,
        visibility: visibility || "public",
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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