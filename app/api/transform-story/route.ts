import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseWithToken } from "@/lib/supabaseServer";
import sharp from "sharp";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

function parseDataUrl(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) throw new Error("Invalid data URL");
  return Buffer.from(match[2], "base64");
}

export async function POST(req: Request) {
  try {

    // ===============================
    // AUTH
    // ===============================
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

    // ===============================
    // BODY
    // ===============================
    const { inputDataUrl, generationToken } = await req.json();

    if (!generationToken) {
      return NextResponse.json(
        { error: "Missing generation token." },
        { status: 403 }
      );
    }

    try {
      const decoded: any = jwt.verify(
        generationToken,
        process.env.GENERATION_TOKEN_SECRET!
      );

      if (decoded.userId !== user.id) {
        return NextResponse.json(
          { error: "Invalid token." },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Token expired or invalid." },
        { status: 403 }
      );
    }

    if (!inputDataUrl) {
      return NextResponse.json(
        { error: "Missing image" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ===============================
    // PREP IMAGE (vertical story)
    // ===============================
    const originalBuffer = parseDataUrl(inputDataUrl);

    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1080, 1920, { fit: "cover" })
      .png()
      .toBuffer();

    const inputPath = `${user.id}/inputs/${Date.now()}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("persona-inputs")
      .upload(inputPath, preparedImage, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // ===============================
    // PROMPT
    // ===============================
    const storyPrompt = `
Improve the overall quality of this photo.

Enhance lighting, contrast, and color balance.
Make the image sharper and clearer.

Keep the appearance natural and realistic.

Do not create cartoon, anime, illustration, or painting styles.
`.trim();

    // ===============================
    // QUEUE GENERATION JOB
    // ===============================
    const { data: job, error: jobError } = await supabaseAdmin
      .from("generation_jobs")
      .insert({
        user_id: user.id,
        job_type: "story",
        status: "pending",
        prompt: storyPrompt,
        input_path: inputPath,
      })
      .select("id, status, created_at")
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: jobError?.message || "Failed to queue story generation." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      message: "Story generation queued.",
    });

  } catch (err: any) {

    console.error("QUEUE STORY ERROR:", err);

    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );

  }
}