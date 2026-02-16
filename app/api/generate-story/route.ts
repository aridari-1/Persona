import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { scene, type } = await req.json();

    if (!scene) {
      return NextResponse.json(
        { error: "Scene description required" },
        { status: 400 }
      );
    }

    const contentType = type === "post" ? "post" : "story";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("persona_dna")
      .eq("id", user.id)
      .single();

    if (!profile?.persona_dna) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const dna = profile.persona_dna;
    const identity = dna.identity || {};
    const camera = dna.camera_lock || {};
    const faceSig = dna.face_signature || "";

    const cameraLockText = `
Camera + pose lock (MUST KEEP IDENTICAL):
- framing: ${camera.framing || "head-and-shoulders portrait"}
- angle: ${camera.angle || "straight-on"}
- lens: ${camera.lens || "85mm"} lens, aperture ${camera.aperture || "f/1.8"}
- expression: ${camera.expression || "neutral relaxed expression"}
- lighting: ${camera.lighting || "soft cinematic key light, gentle fill"}
`.trim();

    const identityLockText = `
IDENTITY LOCK:
${faceSig}

Keep consistent:
- gender: ${identity.gender || ""}
- skin tone: ${identity.skin_tone || ""}
- hair: ${identity.hair || ""}
- eyes: ${identity.eyes || ""}
- face shape: ${identity.face_shape || ""}
- distinctive feature: ${identity.distinctive_feature || ""}

Do not change facial structure.
`.trim();

    const prompt = `
Ultra realistic photography of the same exact person.

${identityLockText}

${cameraLockText}

Scene:
${scene}

High detail, DSLR realism.
Not cartoon.
`.trim();

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image generation failed" },
        { status: 500 }
      );
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;

    // 🔥 DO NOT SAVE HERE
    // Only return preview data

    return NextResponse.json({
      imageUrl,
      scene,
      type: contentType,
    });

  } catch (error) {
    console.error("GENERATION ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
