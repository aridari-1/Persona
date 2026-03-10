import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseWithToken } from "@/lib/supabaseServer";
import sharp from "sharp";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

function parseDataUrl(dataUrl: string): Buffer {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) throw new Error("Invalid data URL format");
  return Buffer.from(match[2], "base64");
}

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

    const { inputDataUrl, generationToken } = await req.json();

    if (!generationToken) {
      return NextResponse.json(
        { error: "Missing generation token." },
        { status: 403 }
      );
    }

    try {
      const decoded = jwt.verify(
        generationToken,
        process.env.GENERATION_TOKEN_SECRET!
      ) as { userId: string };

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
        { error: "Missing input image" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Convert base64 → buffer
    const originalBuffer = parseDataUrl(inputDataUrl);

    // Normalize image (prevents moderation + improves results)
    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1024, 1024, { fit: "inside" })
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

    // Safe prompt to avoid moderation blocks
    const postPrompt = `
Improve the quality of this photo.

Enhance lighting, contrast, sharpness, and color balance.

Make the image look like it was taken with a high quality camera.

Keep the appearance natural and realistic.

Do not create cartoon, anime, illustration, or painting styles.
`.trim();

    // Queue job for worker
    const { data: job, error: jobError } = await supabaseAdmin
      .from("generation_jobs")
      .insert({
        user_id: user.id,
        job_type: "post",
        status: "pending",
        prompt: postPrompt,
        input_path: inputPath,
      })
      .select("id, status, created_at")
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: jobError?.message || "Failed to queue generation job." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      message: "Generation queued successfully.",
    });

  } catch (err: any) {
    console.error("QUEUE POST ERROR:", err);

    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}