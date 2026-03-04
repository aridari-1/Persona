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

  // ===============================
  // 🔥 Fetch remaining generations
  // ===============================
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

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ===============================
  // 🔥 SECURE TRANSFORM FLOW
  // ===============================
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

      // 1️⃣ Request generation token
      const tokenRes = await fetch("/api/request-generation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        alert(tokenData.error || "Generation not allowed");
        setState("idle");
        return;
      }

      // 2️⃣ Call transform endpoint
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
        if (res.status === 429) {
          setRemaining(0);
        }

        if (res.status === 402) {
          alert("Free pool ended. Please purchase credits.");
        } else {
          alert(result.error || "AI transformation failed");
        }

        setState("idle");
        return;
      }

      setPreviewUrl(result.output_url);
      setOutputPath(result.output_path);
      setState("preview");

      await fetchRemaining();

    } catch (err) {
      console.error(err);
      alert("Unexpected error");
      setState("idle");
    }
  };

  // ===============================
  // 🔥 PUBLISH STORY
  // ===============================
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

  return (
    <div className="pb-24 px-4 max-w-xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold">
        Create Story
      </h1>

      {/* Remaining */}
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

      {/* Idle Upload */}
      {state === "idle" && (
        <div className="bg-[#111] p-4 rounded-xl space-y-4">

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

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

      {/* Transforming */}
      {state === "transforming" && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
          <p className="text-gray-400">
            Creating your AI story...
          </p>
        </div>
      )}

      {/* Preview */}
      {state === "preview" && previewUrl && (
        <div className="space-y-4">

          <div className="relative w-full aspect-[9/16] overflow-hidden rounded-xl bg-black">
            <img
              src={previewUrl}
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

      {/* Publishing */}
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