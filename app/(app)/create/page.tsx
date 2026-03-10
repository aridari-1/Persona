"use client";

import { useRouter } from "next/navigation";

export default function CreateHubPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">

      <div className="w-full max-w-md space-y-6">

        <h1 className="text-2xl font-semibold text-center">
          Create
        </h1>

        <button
          onClick={() => router.push("/create/post")}
          className="w-full bg-white text-black py-4 rounded-xl font-semibold"
        >
          Create Post
        </button>

        <button
          onClick={() => router.push("/create/story")}
          className="w-full border border-gray-700 py-4 rounded-xl"
        >
          Create Story
        </button>

      </div>

    </div>
  );
}