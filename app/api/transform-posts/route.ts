import { NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { createClient } from "@supabase/supabase-js";
import { supabaseWithToken } from "@/lib/supabaseServer";
import { logUsage } from "@/lib/usageGuard";
import sharp from "sharp";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
        { error: "Missing input image" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Normalize input image
    const originalBuffer = parseDataUrl(inputDataUrl);

    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();

    const file = await toFile(preparedImage, "input.png", {
      type: "image/png",
    });

    // 🔥 Simplified low-quality prompt (efficient for mini model)
    const postPrompt = `
Improve lighting and clarity.
Balance colors.
Keep image natural and realistic.
Do not distort faces.
Simple modern social media style.
`.trim();

    const result = await openai.images.edit({
      model: "gpt-image-1-mini",
      quality: "low", // 🔥 lowest cost tier
      image: file,
      prompt: postPrompt,
      size: "1024x1024",
    });

    const b64 = result.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "Image generation failed" },
        { status: 500 }
      );
    }

    const rawBuffer = Buffer.from(b64, "base64");

    const optimizedBuffer = await sharp(rawBuffer)
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .webp({ quality: 85 }) // Slightly reduced to match low-tier
      .toBuffer();

    const outputPath = `${user.id}/posts/${Date.now()}.webp`;

    await supabaseAdmin.storage
      .from("persona-posts")
      .upload(outputPath, optimizedBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    const { data: publicUrl } = supabaseAdmin.storage
      .from("persona-posts")
      .getPublicUrl(outputPath);

    await logUsage(token, user.id, "post");

    return NextResponse.json({
      output_url: publicUrl.publicUrl,
      output_path: outputPath,
    });

  } catch (err: any) {
    console.error("TRANSFORM POST ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}