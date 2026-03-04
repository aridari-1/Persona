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
  if (!match) throw new Error("Invalid data URL");
  return Buffer.from(match[2], "base64");
}

export async function POST(req: Request) {
  try {
    // ===============================
    // 1️⃣ AUTH CHECK
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
    // 2️⃣ READ BODY
    // ===============================
    const { inputDataUrl, generationToken } = await req.json();

    if (!generationToken) {
      return NextResponse.json(
        { error: "Missing generation token." },
        { status: 403 }
      );
    }

    // ===============================
    // 3️⃣ VERIFY TOKEN
    // ===============================
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

    // ===============================
    // 4️⃣ IMAGE PREP (Vertical Story)
    // ===============================
    const originalBuffer = parseDataUrl(inputDataUrl);

    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1080, 1920, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();

    const file = await toFile(preparedImage, "story.png", {
      type: "image/png",
    });

    // 🔥 Simplified low-cost story prompt
    const storyPrompt = `
Improve lighting and brightness.
Enhance clarity slightly.
Balance colors naturally.
Keep image realistic.
Do not distort faces.
Simple vertical social media story style.
`.trim();

    // ===============================
    // 5️⃣ AI TRANSFORM (Mini Low)
    // ===============================
    const result = await openai.images.edit({
      model: "gpt-image-1-mini",
      quality: "low",
      image: file,
      prompt: storyPrompt,
      size: "1024x1024", // Mini low cost tier
    });

    const b64 = result.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "Story generation failed" },
        { status: 500 }
      );
    }

    const rawBuffer = Buffer.from(b64, "base64");

    const optimized = await sharp(rawBuffer)
      .resize(1080, 1920, { fit: "cover", position: "centre" })
      .webp({ quality: 80 }) // Slightly reduced for free tier
      .toBuffer();

    // ===============================
    // 6️⃣ STORAGE UPLOAD
    // ===============================
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const outputPath = `${user.id}/stories/${Date.now()}.webp`;

    await supabaseAdmin.storage
      .from("persona-stories")
      .upload(outputPath, optimized, {
        contentType: "image/webp",
        upsert: false,
      });

    const { data } = supabaseAdmin.storage
      .from("persona-stories")
      .getPublicUrl(outputPath);

    // ===============================
    // 7️⃣ LOG USAGE
    // ===============================
    await logUsage(token, user.id, "story");

    return NextResponse.json({
      output_url: data.publicUrl,
      output_path: outputPath,
    });

  } catch (err: any) {
    console.error("TRANSFORM STORY ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}