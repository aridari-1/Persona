"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type CreateState =
  | "idle"
  | "transforming"
  | "preview"
  | "publishing";

export default function CreatePage() {

  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");

  const [state, setState] = useState<CreateState>("idle");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);

  const [remaining, setRemaining] = useState<number | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);

  /* ---------------- FETCH USAGE ---------------- */

  const fetchRemaining = async () => {

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) return;

    const res = await fetch("/api/usage", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await res.json();

    if (res.ok) {
      setRemaining(result.remaining);
    }

  };

  useEffect(() => {
    fetchRemaining();
  }, []);

  /* ---------------- RESTORE JOB ---------------- */

  useEffect(() => {

    const restoreJob = async () => {

      const savedJob = localStorage.getItem("active_generation_job");

      if (!savedJob) return;

      const { data: job } = await supabase
        .from("generation_jobs")
        .select("status, output_path")
        .eq("id", savedJob)
        .single();

      if (!job) return;

      if (job.status === "completed" && job.output_path) {

        const { data } = supabase.storage
          .from("persona-posts")
          .getPublicUrl(job.output_path);

        setPreviewUrl(data.publicUrl);
        setOutputPath(job.output_path);

        setState("preview");

        localStorage.removeItem("active_generation_job");

        return;

      }

      if (job.status === "failed") {

        localStorage.removeItem("active_generation_job");
        setState("idle");

        return;

      }

      setJobId(savedJob);
      setState("transforming");

    };

    restoreJob();

  }, []);

  /* ---------------- REALTIME JOB LISTENER ---------------- */

  useEffect(() => {

    if (!jobId) return;

    const channel = supabase
      .channel(`generation-job-${jobId}`)
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

            localStorage.removeItem("active_generation_job");

            const { data } = supabase.storage
              .from("persona-posts")
              .getPublicUrl(job.output_path);

            setPreviewUrl(data.publicUrl);
            setOutputPath(job.output_path);

            setState("preview");

          }

          if (job.status === "failed") {

            localStorage.removeItem("active_generation_job");

            alert(
              job.error ||
                "AI failed to process this photo. Try a clear portrait."
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

  /* ---------------- FILE TO DATA URL ---------------- */

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;

      reader.readAsDataURL(file);

    });

  /* ---------------- TRANSFORM ---------------- */

  const handleTransform = async () => {

    if (!file) {
      alert("Please upload a photo first.");
      return;
    }

    setState("transforming");

    try {

      const dataUrl = await fileToDataUrl(file);

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        router.push("/login");
        return;
      }

      const permissionRes = await fetch("/api/request-generation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const permissionData = await permissionRes.json();

      if (!permissionRes.ok) {

        setState("idle");

        if (permissionRes.status === 402) {
          router.push("/pricing");
          return;
        }

        if (permissionRes.status === 429) {
          setRemaining(0);
        }

        alert(permissionData.error || "Generation blocked");

        return;

      }

      const generationToken = permissionData.generationToken;

      const res = await fetch("/api/transform-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputDataUrl: dataUrl,
          generationToken,
        }),
      });

      const result = await res.json();

      if (!res.ok) {

        setState("idle");
        alert(result.error || "AI transformation failed");

        return;

      }

      setJobId(result.job_id);

      localStorage.setItem("active_generation_job", result.job_id);

      await fetchRemaining();

    } catch (err) {

      console.error(err);

      alert("Unexpected error occurred.");

      setState("idle");

    }

  };

  /* ---------------- PUBLISH ---------------- */

  const handlePublish = async () => {

    if (!previewUrl || !outputPath) return;

    setState("publishing");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/publish", {
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

    router.push("/feed");

  };

  /* ---------------- UI ---------------- */

  return (

    <div className="pb-24 px-4 space-y-6 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold">
        Create AI Portrait
      </h1>

      <p className="text-sm text-gray-400">
        Upload a photo and AI will create a cinematic portrait.
      </p>

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
            className="text-sm"
          />

          {file && (

            <img
              src={URL.createObjectURL(file)}
              className="w-full rounded-xl"
              alt=""
            />

          )}

          <button
            onClick={handleTransform}
            disabled={!file || remaining === 0}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold disabled:opacity-40"
          >
            Turn into AI
          </button>

        </div>

      )}

      {state === "transforming" && (

        <div className="flex flex-col items-center justify-center space-y-4 py-20">

          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>

          <p className="text-gray-400 text-center">
            AI is enhancing your photo...
          </p>

        </div>

      )}

      {state === "preview" && previewUrl && (

        <div className="space-y-4">

          <img
            src={previewUrl}
            className="w-full rounded-xl"
            alt=""
          />

          {/* 🔥 FIXED TEXTAREA */}
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="
              w-full
              bg-[#0a0a0a]
              text-white
              placeholder-gray-500
              border border-gray-800
              rounded-lg
              p-3
              outline-none
              focus:border-purple-500
              focus:ring-1 focus:ring-purple-500
              caret-white
              resize-none
            "
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
              Publish
            </button>

          </div>

        </div>

      )}

    </div>

  );

}