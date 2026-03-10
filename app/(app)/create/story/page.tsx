"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type StoryState =
  | "idle"
  | "transforming"
  | "preview"
  | "publishing";

export default function CreateStoryPage() {

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");

  const [state, setState] = useState<StoryState>("idle");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);

  const [remaining, setRemaining] = useState<number | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);

  /* ===============================
  Fetch remaining generations
  =============================== */

  const fetchRemaining = async () => {

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    const res = await fetch("/api/usage", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();

    if (res.ok) {
      setRemaining(result.remaining);
    }

  };

  useEffect(() => {
    fetchRemaining();
  }, []);

  /* ===============================
  Restore active generation
  =============================== */

  useEffect(() => {

    const restoreJob = async () => {

      const savedJob = localStorage.getItem("active_story_job");

      if (!savedJob) return;

      const { data: job } = await supabase
        .from("generation_jobs")
        .select("status, output_path")
        .eq("id", savedJob)
        .single();

      if (!job) return;

      if (job.status === "completed" && job.output_path) {

        const { data } = supabase.storage
          .from("persona-stories")
          .getPublicUrl(job.output_path);

        setPreviewUrl(data.publicUrl);
        setOutputPath(job.output_path);
        setState("preview");

        localStorage.removeItem("active_story_job");

        return;

      }

      if (job.status === "failed") {

        localStorage.removeItem("active_story_job");
        setState("idle");
        return;

      }

      setJobId(savedJob);
      setState("transforming");

    };

    restoreJob();

  }, []);

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;

      reader.readAsDataURL(file);

    });

  /* ===============================
  Realtime generation updates
  =============================== */

  useEffect(() => {

    if (!jobId) return;

    const channel = supabase
      .channel(`story-generation-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "generation_jobs",
          filter: `id=eq.${jobId}`,
        },
        async (payload) => {

          const job = payload.new as {
            status: string;
            output_path: string | null;
            error: string | null;
          };

          if (job.status === "completed" && job.output_path) {

            localStorage.removeItem("active_story_job");

            const { data } = supabase.storage
              .from("persona-stories")
              .getPublicUrl(job.output_path);

            setPreviewUrl(data.publicUrl);
            setOutputPath(job.output_path);
            setState("preview");

          }

          if (job.status === "failed") {

            localStorage.removeItem("active_story_job");

            alert(
              job.error ||
              "We couldn't process this photo. Upload a clear portrait."
            );

            setState("idle");

          }

        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [jobId]);

  /* ===============================
  Transform Story
  =============================== */

  const handleTransform = async () => {

    if (!file) {
      alert("Upload a photo first.");
      return;
    }

    if (remaining === 0) {
      alert("Daily limit reached (2 per day).");
      return;
    }

    setState("transforming");

    try {

      const dataUrl = await fileToDataUrl(file);

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const tokenRes = await fetch("/api/request-generation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {

        alert(tokenData.error || "Generation blocked");
        setState("idle");
        return;

      }

      const res = await fetch("/api/transform-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputDataUrl: dataUrl,
          generationToken: tokenData.generationToken,
        }),
      });

      const result = await res.json();

      if (!res.ok) {

        setState("idle");
        alert(result.error || "AI transformation failed");
        return;

      }

      setJobId(result.job_id);

      localStorage.setItem("active_story_job", result.job_id);

      await fetchRemaining();

    } catch (err) {

      console.error(err);

      alert("Unexpected error");

      setState("idle");

    }

  };

  /* ===============================
  Publish Story
  =============================== */

  const handlePublish = async () => {

    if (!previewUrl || !outputPath) return;

    setState("publishing");

    try {

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/publish-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          output_url: previewUrl,
          output_path: outputPath,
          caption,
          visibility: "public",
        }),
      });

      const result = await res.json();

      if (!res.ok) {

        alert(result.error || "Publish failed");

        setState("preview");
        return;

      }

      window.location.href = "/feed";

    } catch (err) {

      console.error(err);

      alert("Publish error");

      setState("preview");

    }

  };

  /* ===============================
  UI
  =============================== */

  return (

    <div className="pb-24 px-4 max-w-xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold">
        Create Story
      </h1>

      {remaining !== null && (
        <div className="text-sm">
          {remaining > 0 ? (
            <span className="text-gray-400">
              {remaining} generation{remaining !== 1 && "s"} remaining today
            </span>
          ) : (
            <span className="text-red-500">
              Daily limit reached (2 per day)
            </span>
          )}
        </div>
      )}

      {state === "idle" && (

        <div className="bg-[#111] p-4 rounded-xl space-y-4">

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <div className="text-xs text-gray-400">
            Upload a clear portrait photo for best results.
          </div>

          {file && (

            <div className="relative w-full aspect-[9/16] overflow-hidden rounded-xl bg-black">

              <img
                src={URL.createObjectURL(file)}
                className="absolute inset-0 w-full h-full object-cover"
                alt=""
              />

            </div>

          )}

          <button
            onClick={handleTransform}
            disabled={!file || remaining === 0}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold disabled:opacity-40"
          >
            Turn Into AI Story
          </button>

        </div>

      )}

      {state === "transforming" && (

        <div className="flex flex-col items-center justify-center py-20 space-y-4">

          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>

          <p className="text-gray-400 text-center">
            Creating your AI story...
            <br />
            You can navigate the app while it processes.
          </p>

        </div>

      )}

      {state === "preview" && previewUrl && (

        <div className="space-y-4">

          <div className="relative w-full aspect-[9/16] overflow-hidden rounded-xl bg-black">

            <img
              src={previewUrl}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
              alt=""
            />

          </div>

          <textarea
            placeholder="Add story caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-lg p-3"
            rows={3}
          />

          <div className="flex space-x-4">

            <button
              onClick={() => {
                setState("idle");
                setPreviewUrl(null);
                setOutputPath(null);
              }}
              className="flex-1 border border-gray-700 py-3 rounded-xl"
            >
              Try Another
            </button>

            <button
              onClick={handlePublish}
              className="flex-1 bg-white text-black py-3 rounded-xl font-semibold"
            >
              Publish Story
            </button>

          </div>

        </div>

      )}

      {state === "publishing" && (

        <div className="flex flex-col items-center justify-center py-20 space-y-4">

          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>

          <p className="text-gray-400">
            Publishing...
          </p>

        </div>

      )}

    </div>

  );

}