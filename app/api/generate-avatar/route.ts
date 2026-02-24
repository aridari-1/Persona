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

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!match) throw new Error("Invalid data URL");
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
      return NextResponse.json(
        { error: "Missing input image" },
        { status: 400 }
      );
    }

    const originalBuffer = parseDataUrl(inputDataUrl);

    // Normalize + center crop for avatar
    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();

    const file = await toFile(preparedImage, "avatar.png", {
      type: "image/png",
    });

    // 🔥 STRONG IDENTITY LOCK PROMPT FOR AVATAR
    const avatarPrompt = `
“Create a high-quality AI-generated portrait based on the uploaded photo.
 Enhance facial symmetry, smooth skin naturally, improve lighting, sharpen details, and give a clean, cinematic, professional AI portrait look while preserving identity, hairstyle, and facial structure.
  Modern AI aesthetic, ultra-sharp, realistic, studio lighting, 4K quality.”

PRIMARY RULE:
Preserve the exact same person. The avatar must clearly resemble the original individual.

Identity preservation:
- Maintain identical facial structure (jawline, cheekbones, chin shape)
- Preserve eye shape and spacing
- Preserve nose shape and proportions
- Preserve lip shape and smile type
- Preserve hairline and hairstyle type
- Preserve natural skin tone
- Keep realistic proportions

Avatar style:
- Clean centered headshot framing
- Professional studio lighting
- Sharp, high-detail face
- Subtle natural skin smoothing (no plastic look)
- Modern AI aesthetic
- Balanced cinematic lighting
- Social media profile quality

Restrictions:
- Do NOT change ethnicity, gender, or age
- Do NOT modify facial geometry
- Do NOT add makeup or accessories
- No text, no watermark
- No cartoon, no anime

Final result:
A realistic, high-end AI portrait avatar that strongly resembles the original person.
`.trim();

    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt: avatarPrompt,
      size: "1024x1024",
    });

    const b64 = result.data?.[0]?.b64_json;

    if (!b64) {
      console.error("AVATAR IMAGE RESPONSE:", result);
      return NextResponse.json(
        { error: "Avatar generation failed" },
        { status: 500 }
      );
    }

    const rawBuffer = Buffer.from(b64, "base64");

    // 🔥 Final avatar optimization (mobile perfect)
    const optimizedBuffer = await sharp(rawBuffer)
      .resize(512, 512, { fit: "cover", position: "centre" })
      .webp({ quality: 90 })
      .toBuffer();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const path = `${user.id}/avatar.webp`;

    await supabaseAdmin.storage
      .from("persona-avatars")
      .upload(path, optimizedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    const { data: publicUrl } = supabaseAdmin.storage
      .from("persona-avatars")
      .getPublicUrl(path);

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl.publicUrl })
      .eq("id", user.id);

    return NextResponse.json({
      avatar_url: publicUrl.publicUrl,
    });

  } catch (err: any) {
    console.error("AVATAR GEN ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}