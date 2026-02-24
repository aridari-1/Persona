"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function PreviewPost() {
  const [image, setImage] = useState<string | null>(null);
  const [scene, setScene] = useState("");
  const [type, setType] = useState<"story" | "post">("post");
  const [title, setTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingPost");

    if (!stored) {
      router.push("/create-story");
      return;
    }

    const data = JSON.parse(stored);
    setImage(data.imageUrl);
    setScene(data.scene);
    setType(data.type);
  }, []);

  const handlePublish = async () => {
    if (!image) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("posts").insert({
      user_id: user.id,
      type,
      media_url: image,
      caption: scene,
      title, // 🔥 NEW COLUMN (you must add this)
    });

    sessionStorage.removeItem("pendingPost");
    router.push("/feed");
  };

  if (!image) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <h2 className="text-xl mb-6">Preview</h2>

      <img
        src={image}
        className="w-full rounded-xl mb-6"
      />

      <input
        placeholder="Add a title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-3 bg-black border border-gray-700 rounded-lg mb-6"
      />

      <button
        onClick={handlePublish}
        className="neon-button w-full py-3 rounded-xl text-black font-semibold"
      >
        Publish
      </button>

    </div>
  );
}
