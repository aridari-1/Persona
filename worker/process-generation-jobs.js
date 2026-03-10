require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
const { toFile } = require("openai/uploads");
const sharp = require("sharp");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadInput(inputPath) {

  const { data, error } = await supabase.storage
    .from("persona-inputs")
    .download(inputPath);

  if (error) throw error;

  return Buffer.from(await data.arrayBuffer());
}

/* ------------------------------------
IMAGE GENERATION (GPT IMAGE MINI)
------------------------------------ */

async function generateImage(file, prompt, size) {

  const result = await openai.images.edit({
    model: "gpt-image-1-mini",
    image: file,
    prompt: prompt,
    size: size
  });

  const b64 = result.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("No image returned from OpenAI");
  }

  return Buffer.from(b64, "base64");
}

/* ------------------------------------
PROCESS JOB
------------------------------------ */

async function processJob(job) {

  console.log("Processing job:", job.id, job.job_type);

  try {

    if (!job.input_path) {
      throw new Error("Missing input_path");
    }

    /* ------------------------------
    DOWNLOAD INPUT IMAGE
    ------------------------------ */

    const inputBuffer = await downloadInput(job.input_path);

    const preparedImage = await sharp(inputBuffer)
      .rotate()
      .resize(1024, 1024, { fit: "inside" })
      .png()
      .toBuffer();

    const file = await toFile(preparedImage, "input.png", {
      type: "image/png"
    });

    /* ------------------------------
    DETERMINE SIZE
    ------------------------------ */

    let generationSize = "1024x1024";

    if (job.job_type === "story") {
      generationSize = "1024x1536"; // vertical
    }

    /* ------------------------------
    GENERATE IMAGE
    ------------------------------ */

    let rawBuffer;

    try {

      rawBuffer = await generateImage(file, job.prompt, generationSize);

    } catch (err) {

      if (err.message && err.message.includes("safety")) {

        console.log("Safety retry");

        const fallbackPrompt = `
Improve lighting, clarity and color balance.
Keep the appearance natural and realistic.
`;

        rawBuffer = await generateImage(file, fallbackPrompt, generationSize);

      } else {
        throw err;
      }

    }

    let optimizedBuffer;
    let bucket;
    let outputPath;

    /* ------------------------------
    POST
    ------------------------------ */

    if (job.job_type === "post") {

      optimizedBuffer = await sharp(rawBuffer)
        .resize(1024, 1024, { fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer();

      bucket = "persona-posts";
      outputPath = `${job.user_id}/posts/${job.id}.webp`;

    }

    /* ------------------------------
    STORY
    ------------------------------ */

    if (job.job_type === "story") {

      optimizedBuffer = await sharp(rawBuffer)
        .resize(1080, 1920, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();

      bucket = "persona-stories";
      outputPath = `${job.user_id}/stories/${job.id}.webp`;

    }

    /* ------------------------------
    AVATAR
    ------------------------------ */

    if (job.job_type === "avatar") {

      optimizedBuffer = await sharp(rawBuffer)
        .resize(512, 512, { fit: "cover" })
        .webp({ quality: 90 })
        .toBuffer();

      bucket = "persona-avatars";
      outputPath = `${job.user_id}/avatar.webp`;

    }

    if (!bucket || !outputPath) {
      throw new Error("Invalid job type");
    }

    /* ------------------------------
    UPLOAD IMAGE
    ------------------------------ */

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(outputPath, optimizedBuffer, {
        contentType: "image/webp",
        upsert: true
      });

    if (uploadError) throw uploadError;

    console.log("Uploaded:", bucket, outputPath);

    /* ------------------------------
    UPDATE PROFILE AVATAR
    ------------------------------ */

    if (job.job_type === "avatar") {

      const { data } = supabase.storage
        .from("persona-avatars")
        .getPublicUrl(outputPath);

      await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", job.user_id);

    }

    /* ------------------------------
    COMPLETE JOB
    ------------------------------ */

    await supabase
      .from("generation_jobs")
      .update({
        status: "completed",
        output_path: outputPath,
        completed_at: new Date().toISOString()
      })
      .eq("id", job.id);

    console.log("Job completed:", job.id);

  } catch (err) {

    console.error("Job failed:", job.id, err.message);

    await supabase
      .from("generation_jobs")
      .update({
        status: "failed",
        error: err.message,
        completed_at: new Date().toISOString()
      })
      .eq("id", job.id);

  }

}

/* ------------------------------------
WORKER LOOP
------------------------------------ */

async function workerLoop() {

  console.log("AI Worker started...");

  while (true) {

    const { data: jobs } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (!jobs || jobs.length === 0) {
      await sleep(1500);
      continue;
    }

    const job = jobs[0];

    const { error } = await supabase
      .from("generation_jobs")
      .update({ status: "processing" })
      .eq("id", job.id)
      .eq("status", "pending");

    if (!error) {
      await processJob(job);
    }

  }

}

workerLoop();