"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 space-y-6">

        <h1 className="text-5xl md:text-6xl font-bold neon-text">
          PERSONA
        </h1>

        <p className="text-gray-400 max-w-xl text-lg">
          Turn your photos into AI-powered art.
          Describe it. Transform it. Post it.
        </p>

        <div className="flex space-x-4 mt-6">
          <Link
            href="/signup"
            className="neon-button px-8 py-4 rounded-xl text-black font-semibold"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="border border-gray-700 px-8 py-4 rounded-xl"
          >
            Login
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20 bg-[#0f0f14]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">

          <div className="space-y-4">
            <div className="text-4xl">📸</div>
            <h3 className="text-xl font-semibold">Upload</h3>
            <p className="text-gray-400 text-sm">
              Upload any photo you want to transform.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-4xl">✨</div>
            <h3 className="text-xl font-semibold">Describe</h3>
            <p className="text-gray-400 text-sm">
              Tell AI how to reimagine your image.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-4xl">🚀</div>
            <h3 className="text-xl font-semibold">Post</h3>
            <p className="text-gray-400 text-sm">
              Share your AI transformation with the world.
            </p>
          </div>

        </div>
      </section>

      {/* DEMO GRID */}
      <section className="px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          See the Transformation
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">

          <div className="aspect-square bg-[#111] rounded-xl"></div>
          <div className="aspect-square bg-[#111] rounded-xl"></div>
          <div className="aspect-square bg-[#111] rounded-xl"></div>
          <div className="aspect-square bg-[#111] rounded-xl"></div>

        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-24 text-center bg-[#0f0f14] space-y-6">

        <h2 className="text-3xl font-bold">
          Ready to Create Your AI Persona?
        </h2>

        <Link
          href="/signup"
          className="neon-button px-10 py-4 rounded-xl text-black font-semibold"
        >
          Join Persona
        </Link>

      </section>

    </main>
  );
}