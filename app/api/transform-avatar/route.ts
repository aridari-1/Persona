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
    // 3️⃣ VERIFY SIGNED GENERATION TOKEN
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
    // 4️⃣ IMAGE PREP
    // ===============================
    const originalBuffer = parseDataUrl(inputDataUrl);

    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();

    const file = await toFile(preparedImage, "avatar.png", {
      type: "image/png",
    });

    // ===============================
    // 5️⃣ AI PROMPT
    // ===============================
    const avatarPrompt = `
Create a high-quality professional AI portrait.
Preserve identity exactly.
Improve lighting, clarity, sharpness.
Do NOT change ethnicity, age, or facial geometry.
No cartoon, no fantasy.
Studio-level portrait.

Identity constraints:
- Keep identical facial structure
- Preserve eye shape and spacing
- Preserve nose shape and proportions
- Preserve lip shape and mouth width
- Preserve hairline and hairstyle
- Preserve natural skin tone
- Maintain realistic face proportions
`.trim();

    // ===============================
    // 6️⃣ AI GENERATION
    // ===============================
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt: avatarPrompt,
      size: "1024x1024",
    });

    const b64 = result.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "Avatar generation failed" },
        { status: 500 }
      );
    }

    const rawBuffer = Buffer.from(b64, "base64");

    const optimized = await sharp(rawBuffer)
      .resize(512, 512, { fit: "cover", position: "centre" })
      .webp({ quality: 90 })
      .toBuffer();

    // ===============================
    // 7️⃣ STORAGE UPLOAD
    // ===============================
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const path = `${user.id}/avatar.webp`;

    await supabaseAdmin.storage
      .from("persona-avatars")
      .upload(path, optimized, {
        contentType: "image/webp",
        upsert: true,
      });

    const { data } = supabaseAdmin.storage
      .from("persona-avatars")
      .getPublicUrl(path);

    // ===============================
    // 8️⃣ UPDATE PROFILE
    // ===============================
    await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);

    // ===============================
    // 9️⃣ LOG USAGE (AFTER SUCCESS)
    // ===============================
    await logUsage(token, user.id, "avatar");

    return NextResponse.json({
      avatar_url: data.publicUrl,
    });

  } catch (err: any) {
    console.error("AVATAR TRANSFORM ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}