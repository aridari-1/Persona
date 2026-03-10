"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold tracking-wide">PERSONA</h1>

        <div className="flex items-center space-x-6 text-sm">
          <Link href="/login" className="text-gray-400 hover:text-white">
            Login
          </Link>

          <Link
            href="/signup"
            className="px-5 py-2 rounded-lg bg-white text-black font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 px-6 py-20 items-center">

        {/* LEFT VISUAL */}
        <div className="grid grid-cols-2 gap-4">

          <div className="aspect-square bg-[#111] rounded-xl"></div>
          <div className="aspect-square bg-[#111] rounded-xl"></div>
          <div className="aspect-square bg-[#111] rounded-xl"></div>
          <div className="aspect-square bg-[#111] rounded-xl"></div>

        </div>

        {/* RIGHT TEXT */}
        <div className="space-y-6">

          <h1 className="text-5xl font-bold leading-tight">
            Create Your
            <span className="block neon-text">
              AI Persona
            </span>
          </h1>

          <p className="text-gray-400 text-lg">
            Upload a photo. Describe your vision.
            Transform it into stunning AI-generated images
            and share them with the world.
          </p>

          <div className="flex space-x-4 pt-4">

            <Link
              href="/signup"
              className="neon-button px-8 py-4 rounded-xl text-black font-semibold"
            >
              Start Creating
            </Link>

            <Link
              href="/login"
              className="border border-gray-700 px-8 py-4 rounded-xl hover:bg-[#111]"
            >
              Login
            </Link>

          </div>

        </div>

      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-24 border-t border-[#1a1a1a]">
        <div className="max-w-6xl mx-auto text-center space-y-16">

          <h2 className="text-3xl font-bold">
            How Persona Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">

            <div className="space-y-4">
              <div className="text-4xl">📸</div>
              <h3 className="text-xl font-semibold">Upload</h3>
              <p className="text-gray-400 text-sm">
                Upload any photo to begin your AI transformation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-4xl">🧠</div>
              <h3 className="text-xl font-semibold">Describe</h3>
              <p className="text-gray-400 text-sm">
                Tell AI how you want the image to look.
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-4xl">✨</div>
              <h3 className="text-xl font-semibold">Transform</h3>
              <p className="text-gray-400 text-sm">
                Generate cinematic AI photos ready to share.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="px-6 py-24 bg-[#0f0f14]">

        <div className="max-w-6xl mx-auto text-center space-y-12">

          <h2 className="text-3xl font-bold">
            AI Transformations
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            <div className="aspect-square bg-[#111] rounded-xl"></div>
            <div className="aspect-square bg-[#111] rounded-xl"></div>
            <div className="aspect-square bg-[#111] rounded-xl"></div>
            <div className="aspect-square bg-[#111] rounded-xl"></div>

          </div>

        </div>

      </section>

      {/* FINAL CTA */}
      <section className="text-center py-24 space-y-6">

        <h2 className="text-3xl font-bold">
          Start Building Your Persona
        </h2>

        <Link
          href="/signup"
          className="neon-button px-10 py-4 rounded-xl text-black font-semibold"
        >
          Join Persona
        </Link>

      </section>

      {/* FOOTER */}
      <footer className="text-center text-gray-500 text-sm py-10 border-t border-[#1a1a1a]">
        © {new Date().getFullYear()} Persona
      </footer>

    </main>
  );
}