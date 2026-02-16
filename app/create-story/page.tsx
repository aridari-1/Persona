"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CreateStoryPage() {
  const [scene, setScene] = useState("");
  const [type, setType] = useState<"story" | "post">("story");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

 const handleGenerate = async () => {
  if (!scene) {
    alert("Describe your scene.");
    return;
  }

  setLoading(true);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    router.push("/");
    return;
  }

  const res = await fetch("/api/generate-story", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      scene,
      type,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.imageUrl) {
    alert("Generation failed.");
    setLoading(false);
    return;
  }

  // 🔥 Store temporary post
  sessionStorage.setItem(
    "pendingPost",
    JSON.stringify(data)
  );

  router.push("/preview-post");
};


  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-black border-b border-gray-800 p-4 text-center z-50">
        <h1 className="text-lg neon-text font-semibold">
          Create
        </h1>
      </div>

      <div className="mt-24 px-6 max-w-md mx-auto w-full">

        {/* Toggle */}
        <div className="flex justify-center gap-4 mb-6">

          <button
            onClick={() => setType("story")}
            className={`px-4 py-2 rounded-full text-sm ${
              type === "story"
                ? "neon-button text-black"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            Story
          </button>

          <button
            onClick={() => setType("post")}
            className={`px-4 py-2 rounded-full text-sm ${
              type === "post"
                ? "neon-button text-black"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            Post
          </button>

        </div>

        {/* Scene Input */}
        <textarea
          placeholder={
            type === "story"
              ? "Describe your daily moment..."
              : "Describe your permanent post..."
          }
          className="w-full p-4 bg-black border border-gray-700 rounded-xl mb-6 text-sm"
          rows={4}
          value={scene}
          onChange={(e) => setScene(e.target.value)}
        />

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="neon-button w-full py-3 rounded-xl text-black font-semibold disabled:opacity-50"
        >
          {loading
            ? "Generating..."
            : type === "story"
            ? "Generate Story"
            : "Generate Post"}
        </button>

      </div>

    </div>
  );
}
