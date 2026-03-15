"use client";

import { useRouter } from "next/navigation";

export default function CreateHubPage() {

  const router = useRouter();

  return (

    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">

      <div className="w-full max-w-md space-y-8">

        {/* TITLE */}

        <div className="text-center space-y-2">

          <h1 className="text-3xl font-bold">
            Create
          </h1>

          <p className="text-gray-400 text-sm">
            Turn a photo into an AI portrait or story.
          </p>

        </div>


        {/* ACTIONS */}

        <div className="space-y-4">

          <button
            onClick={() => router.push("/create/post")}
            className="w-full bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            Create Post
          </button>

          <button
            onClick={() => router.push("/create/story")}
            className="w-full border border-gray-700 py-4 rounded-xl hover:bg-[#111] transition"
          >
            Create Story
          </button>

        </div>


        {/* AI PHOTO TIPS */}

        <div className="bg-[#111] border border-gray-800 rounded-xl p-4 space-y-3 text-sm">

          <p className="font-semibold text-gray-300">
            Tips for best AI results
          </p>

          <ul className="list-disc pl-5 space-y-1 text-gray-400">

            <li>Upload a clear photo of one person</li>

            <li>Face should be visible and well lit</li>

            <li>Avoid masks, or heavy shadows</li>

            <li>Use a real photo (not cartoon or drawing)</li>

            <li>Look directly at the camera if possible</li>

          </ul>

          <p className="text-gray-500 pt-2 text-xs">

            Photos of celebrities, minors, or copyrighted images
            may be rejected by our AI safety filters.

          </p>

        </div>

      </div>

    </div>

  );

}
