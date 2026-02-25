"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CreateState =
  | "idle"
  | "transforming"
  | "preview"
  | "publishing";

export default function CreatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [state, setState] = useState<CreateState>("idle");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

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
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/transform-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputDataUrl: dataUrl,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "AI transformation failed");
        setState("idle");
        return;
      }

      setPreviewUrl(result.output_url);
      setOutputPath(result.output_path);
      setState("preview");
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
      setState("idle");
    }
  };

  const handlePublish = async () => {
    if (!previewUrl || !outputPath) return;

    setState("publishing");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      window.location.href = "/login";
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

    window.location.href = "/feed";
  };

  return (
    <div className="pb-24 px-4 space-y-6">

      <h1 className="text-2xl font-bold">
        Create AI Portrait
      </h1>

      {/* Upload Section */}
      {state === "idle" && (
        <div className="bg-[#111] p-4 rounded-xl space-y-4">
          <input
            type="file"
            accept="image/*"
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
            className="w-full py-3 rounded-xl bg-white text-black font-semibold"
          >
            Turn into AI
          </button>
        </div>
      )}

      {/* Loading State */}
      {state === "transforming" && (
        <div className="flex flex-col items-center justify-center space-y-4 py-20">
          <div className="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
          <p className="text-gray-400">
            Creating your AI portrait...
          </p>
        </div>
      )}

      {/* Preview */}
      {state === "preview" && previewUrl && (
        <div className="space-y-4">

          <img
            src={previewUrl}
            className="w-full rounded-xl"
            alt=""
          />

          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white"
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
  Publish
</button>
          </div>

        </div>
      )}

    </div>
  );
}