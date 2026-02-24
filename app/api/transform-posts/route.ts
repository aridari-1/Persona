import { NextResponse } from "next/server";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { createClient } from "@supabase/supabase-js";
import { supabaseWithToken } from "@/lib/supabaseServer";
import sharp from "sharp";

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
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    const user = userRes?.user;

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inputDataUrl } = await req.json();
    if (!inputDataUrl) {
      return NextResponse.json({ error: "Missing input image" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Decode user image
    const originalBuffer = parseDataUrl(inputDataUrl);

    // Normalize image (consistent quality + orientation)
    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();

    // Convert to proper multipart file for GPT-image-1
    const file = await toFile(preparedImage, "input.png", {
      type: "image/png",
    });

    // 🔥 FINAL IDENTITY-LOCK PROMPT
    const internalPrompt = `
“Create a high-quality AI-generated portrait based on the uploaded photo.
 Enhance facial symmetry, smooth skin naturally, improve lighting, sharpen details, and give a clean, cinematic, professional AI portrait look while preserving identity, hairstyle, and facial structure.
  Modern AI aesthetic, ultra-sharp, realistic, studio lighting, 4K quality.”

PRIMARY RULE:
Preserve the exact same person. The generated image must clearly resemble the original individual.
Enhance this image into a high-quality AI social media post.
Improve lighting, color grading, depth, and clarity.
Keep realism.
Do not distort faces unnaturally.
Modern cinematic look.


`.trim();

    // Generate AI portrait
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt: internalPrompt,
      size: "1024x1024",
    });

    const b64 = result.data?.[0]?.b64_json;

    if (!b64) {
      console.error("IMAGE RESPONSE:", result);
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    const rawBuffer = Buffer.from(b64, "base64");

    // Optimize for mobile
    const optimizedBuffer = await sharp(rawBuffer)
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .webp({ quality: 95 })
      .toBuffer();

    const outputPath = `${user.id}/posts/${Date.now()}.webp`;

    await supabaseAdmin.storage
      .from("persona-posts")
      .upload(outputPath, optimizedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    const { data: publicUrl } = supabaseAdmin.storage
      .from("persona-posts")
      .getPublicUrl(outputPath);

    return NextResponse.json({
      output_url: publicUrl.publicUrl,
      output_path: outputPath,
    });

  } catch (err: any) {
    console.error("TRANSFORM ERROR:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}