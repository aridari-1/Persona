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

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const originalBuffer = Buffer.from(imageBase64, "base64");

    // Normalize image before AI processing
    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();

    const file = await toFile(preparedImage, "avatar.png", {
      type: "image/png",
    });

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
- Preserve lip shape and mouth width
- Preserve hairline and hairstyle
- Preserve natural skin tone
- Maintain realistic proportions

Enhancement:
- Professional studio lighting
- Clean centered headshot framing
- Improve sharpness and clarity
- Subtle natural skin smoothing (no plastic look)
- Modern premium AI portrait quality

Restrictions:
- Do NOT change ethnicity, gender, or age
- Do NOT modify facial geometry
- No text or watermark
- No cartoon or fantasy style

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
      return NextResponse.json(
        { error: "Avatar generation failed" },
        { status: 500 }
      );
    }

    const rawBuffer = Buffer.from(b64, "base64");

    // Optimize for mobile
    const optimizedBuffer = await sharp(rawBuffer)
      .resize(512, 512, { fit: "cover", position: "centre" })
      .webp({ quality: 90 })
      .toBuffer();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const filePath = `${user.id}/avatar.webp`;

    await supabaseAdmin.storage
      .from("persona-avatars")
      .upload(filePath, optimizedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    const { data: publicUrl } = supabaseAdmin.storage
      .from("persona-avatars")
      .getPublicUrl(filePath);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl.publicUrl,
      })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      avatar_url: publicUrl.publicUrl,
    });

  } catch (err: any) {
    console.error("AVATAR ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}