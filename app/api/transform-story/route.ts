import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseWithToken } from "@/lib/supabaseServer";
import sharp from "sharp";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

/* ---------------------------------- */
/* CONFIG                             */
/* ---------------------------------- */

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const SUPPORTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/* ---------------------------------- */
/* HELPERS                            */
/* ---------------------------------- */

function parseDataUrl(dataUrl: string) {

  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);

  if (!match) {
    throw new Error("Invalid data URL");
  }

  const mime = match[1];
  const base64 = match[2];

  if (!SUPPORTED_TYPES.includes(mime)) {
    throw new Error("Unsupported image type");
  }

  const buffer = Buffer.from(base64, "base64");

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error("Image too large (max 8MB)");
  }

  return buffer;
}

/* ---------------------------------- */
/* ROUTE                              */
/* ---------------------------------- */

export async function POST(req: Request) {

  try {

    /* ---------------------------
       AUTH
    --------------------------- */

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const supabase = supabaseWithToken(token);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ---------------------------
       BODY
    --------------------------- */

    const body = await req.json();

    const inputDataUrl = body.inputDataUrl;
    const generationToken = body.generationToken;

    if (!generationToken) {
      return NextResponse.json(
        { error: "Missing generation token" },
        { status: 403 }
      );
    }

    /* ---------------------------
       VERIFY GENERATION TOKEN
    --------------------------- */

    try {

      const decoded: any = jwt.verify(
        generationToken,
        process.env.GENERATION_TOKEN_SECRET!,
        { algorithms: ["HS256"] }
      );

      if (decoded.userId !== user.id) {
        return NextResponse.json(
          { error: "Invalid token owner" },
          { status: 403 }
        );
      }

      if (!decoded.exp) {
        return NextResponse.json(
          { error: "Token missing expiration" },
          { status: 403 }
        );
      }

    } catch {

      return NextResponse.json(
        { error: "Token expired or invalid" },
        { status: 403 }
      );

    }

    if (!inputDataUrl) {
      return NextResponse.json(
        { error: "Missing image" },
        { status: 400 }
      );
    }

    /* ---------------------------
       ADMIN CLIENT
    --------------------------- */

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false }
      }
    );

    /* ---------------------------
       IMAGE PREP
    --------------------------- */

    const originalBuffer = parseDataUrl(inputDataUrl);

    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1080, 1920, {
        fit: "cover",
        withoutEnlargement: true
      })
      .png({
        compressionLevel: 9,
        quality: 90
      })
      .toBuffer();

    /* ---------------------------
       UPLOAD INPUT
    --------------------------- */

    const inputPath = `${user.id}/inputs/${Date.now()}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("persona-inputs")
      .upload(inputPath, preparedImage, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {

      console.error("UPLOAD ERROR:", uploadError);

      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      );

    }

    /* ---------------------------
       PROMPT
    --------------------------- */

    const storyPrompt = `
Transform this person into a cinematic AI persona.

Keep facial identity recognizable, but enhance features:
- sharper jawline
- cinematic lighting
- professional color grading
- dramatic shadows

Style: ultra-realistic, high-end photography, magazine quality

Make it feel like a character, not just a photo.

DO NOT make it look like a normal selfie.
Avoid:
- dark or moody lighting
- changing background composition
`.trim();

    /* ---------------------------
       QUEUE GENERATION
    --------------------------- */

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

      console.error("JOB ERROR:", jobError);

      return NextResponse.json(
        { error: "Failed to queue generation" },
        { status: 500 }
      );

    }

    /* ---------------------------
       RESPONSE
    --------------------------- */

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      message: "Story generation queued",
    });

  } catch (err: any) {

    console.error("QUEUE STORY ERROR:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );

  }

}
