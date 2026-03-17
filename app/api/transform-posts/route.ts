import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseWithToken } from "@/lib/supabaseServer";
import sharp from "sharp";
import jwt from "jsonwebtoken";

export const runtime = "nodejs";

/* ---------------------------------- */
/* CONFIG                             */
/* ---------------------------------- */

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/* ---------------------------------- */
/* PARSE DATA URL                     */
/* ---------------------------------- */

function parseDataUrl(dataUrl: string): Buffer {

  const match = dataUrl.match(/^data:(.+);base64,(.*)$/);

  if (!match) {
    throw new Error("Invalid data URL format");
  }

  const mime = match[1];
  const base64 = match[2];

  if (!SUPPORTED_TYPES.includes(mime)) {
    throw new Error("Unsupported image format");
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

    /* -----------------------------
       AUTHORIZATION
    ----------------------------- */

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

    /* -----------------------------
       BODY
    ----------------------------- */

    const body = await req.json();

    const inputDataUrl = body.inputDataUrl;
    const generationToken = body.generationToken;

    if (!generationToken) {
      return NextResponse.json(
        { error: "Missing generation token." },
        { status: 403 }
      );
    }

    /* -----------------------------
       VERIFY GENERATION TOKEN
    ----------------------------- */

    try {

      const decoded: any = jwt.verify(
        generationToken,
        process.env.GENERATION_TOKEN_SECRET!,
        { algorithms: ["HS256"] }
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

    /* -----------------------------
       ADMIN CLIENT
    ----------------------------- */

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    /* -----------------------------
       IMAGE PREPARATION
    ----------------------------- */

    const originalBuffer = parseDataUrl(inputDataUrl);

    const preparedImage = await sharp(originalBuffer)
      .rotate()
      .resize(1024, 1024, {
        fit: "inside",
        withoutEnlargement: true
      })
      .png({
        compressionLevel: 9,
        quality: 90
      })
      .toBuffer();

    /* -----------------------------
       UPLOAD INPUT IMAGE
    ----------------------------- */

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

    /* -----------------------------
       PROMPT
    ----------------------------- */

    const postPrompt = `
Transform this person into a cinematic AI persona.

Keep facial identity recognizable, but enhance features:
- sharper jawline
- cinematic lighting
-improve lighting and contrast
- professional color grading
- dramatic shadows
-dont make background too dark or too bright, 

Style: ultra-realistic, high-end photography, magazine quality

Make it feel like a character, not just a photo.

DO NOT make it look like a normal selfie.
`.trim();

    /* -----------------------------
       QUEUE GENERATION JOB
    ----------------------------- */

    const { data: job, error: jobError } =
      await supabaseAdmin
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

      console.error("JOB ERROR:", jobError);

      return NextResponse.json(
        { error: "Failed to queue generation job." },
        { status: 500 }
      );

    }

    /* -----------------------------
       RESPONSE
    ----------------------------- */

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