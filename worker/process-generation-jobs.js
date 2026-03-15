require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
const { toFile } = require("openai/uploads");
const sharp = require("sharp");

const PARALLEL_JOBS = 20;
const POLL_INTERVAL_MS = 2500;
const STUCK_JOB_MINUTES = 10;

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

/* ------------------------------------
RESET STUCK JOBS
------------------------------------ */

async function resetStuckJobs() {

  const cutoff = new Date(
    Date.now() - STUCK_JOB_MINUTES * 60 * 1000
  ).toISOString();

  const { error } = await supabase
    .from("generation_jobs")
    .update({ status: "pending" })
    .eq("status", "processing")
    .lt("updated_at", cutoff);

  if (!error) {
    console.log("Checked for stuck jobs");
  }
}

/* ------------------------------------
DOWNLOAD INPUT IMAGE
------------------------------------ */

async function downloadInput(inputPath) {

  const { data, error } = await supabase.storage
    .from("persona-inputs")
    .download(inputPath);

  if (error) throw error;

  return Buffer.from(await data.arrayBuffer());
}

/* ------------------------------------
OPENAI IMAGE GENERATION
------------------------------------ */

async function generateImage(file, prompt, size) {

  const result = await openai.images.edit({
    model: "gpt-image-1-mini",
    image: file,
    prompt,
    size,
  });

  const b64 = result.data?.[0]?.b64_json;

  if (!b64) throw new Error("OpenAI returned no image");

  return Buffer.from(b64, "base64");
}

/* ------------------------------------
PROCESS ONE JOB
------------------------------------ */

async function processJob(job) {

  console.log("Processing job:", job.id);

  try {

    const inputBuffer = await downloadInput(job.input_path);

    const preparedImage = await sharp(inputBuffer)
      .rotate()
      .resize(1024, 1024, { fit: "inside" })
      .png()
      .toBuffer();

    const file = await toFile(preparedImage, "input.png", {
      type: "image/png",
    });

    let generationSize = "1024x1024";

    if (job.job_type === "story") {
      generationSize = "1024x1536";
    }

    let rawBuffer;

    try {

      rawBuffer = await generateImage(
        file,
        job.prompt,
        generationSize
      );

    } catch (err) {

      if (err.message?.includes("safety")) {

        console.log("Safety retry");

        rawBuffer = await generateImage(
          file,
          "Improve lighting and clarity while keeping it natural.",
          generationSize
        );

      } else {
        throw err;
      }

    }

    let optimizedBuffer;
    let bucket;
    let outputPath;

    if (job.job_type === "post") {

      optimizedBuffer = await sharp(rawBuffer)
        .resize(1024, 1024, { fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer();

      bucket = "persona-posts";
      outputPath = `${job.user_id}/posts/${job.id}.webp`;

    }

    else if (job.job_type === "story") {

      optimizedBuffer = await sharp(rawBuffer)
        .resize(1080, 1920, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();

      bucket = "persona-stories";
      outputPath = `${job.user_id}/stories/${job.id}.webp`;

    }

    else if (job.job_type === "avatar") {

      optimizedBuffer = await sharp(rawBuffer)
        .resize(512, 512, { fit: "cover" })
        .webp({ quality: 90 })
        .toBuffer();

      bucket = "persona-avatars";
      outputPath = `${job.user_id}/avatar.webp`;

    }

    else {

      throw new Error("Invalid job type");

    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(outputPath, optimizedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    if (job.job_type === "avatar") {

      const { data } = supabase.storage
        .from("persona-avatars")
        .getPublicUrl(outputPath);

      await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", job.user_id);

    }

    await supabase
      .from("generation_jobs")
      .update({
        status: "completed",
        output_path: outputPath,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    console.log("Completed job:", job.id);

  } catch (err) {

    console.error("Job failed:", job.id, err.message);

    await supabase
      .from("generation_jobs")
      .update({
        status: "failed",
        error: err.message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

  }
}

/* ------------------------------------
WORKER LOOP
------------------------------------ */

async function workerLoop() {

  console.log("AI Worker started");

  while (true) {

    await resetStuckJobs();

    const { data: jobs, error } = await supabase
      .from("generation_jobs")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(PARALLEL_JOBS);

    if (error) {

      console.error("Fetch jobs error:", error.message);
      await sleep(POLL_INTERVAL_MS);
      continue;

    }

    if (!jobs || jobs.length === 0) {

      await sleep(POLL_INTERVAL_MS);
      continue;

    }

    await Promise.all(

      jobs.map(async (job) => {

        const { count } = await supabase
          .from("generation_jobs")
          .update({ status: "processing", updated_at: new Date().toISOString() })
          .eq("id", job.id)
          .eq("status", "pending")
          .select("*", { count: "exact", head: true });

        if (count === 1) {
          await processJob(job);
        }

      })

    );

  }

}

workerLoop();