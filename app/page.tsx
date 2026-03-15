"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">

        <h1 className="text-xl font-semibold tracking-widest">
          PERSONA
        </h1>

        <div className="flex items-center space-x-6 text-sm">

          <Link
            href="/login"
            className="text-gray-400 hover:text-white transition"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="px-5 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-200 transition"
          >
            Get Started
          </Link>

        </div>

      </nav>


      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">

        {/* HERO TEXT */}
        <div className="space-y-8">

          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">

            Create your

            <span className="block bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              AI Persona
            </span>

          </h1>

          <p className="text-gray-400 text-lg max-w-lg">
            Turn your photos into cinematic AI portraits and
            share them on the first social network built
            entirely around AI identities.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">

            <Link
              href="/signup"
              className="px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
            >
              Start Creating
            </Link>

            <Link
              href="/login"
              className="px-8 py-4 rounded-xl border border-gray-700 hover:bg-[#111] transition"
            >
              Login
            </Link>

          </div>

        </div>


        {/* HERO VISUAL */}
        <div className="grid grid-cols-2 gap-4">

          {[1,2,3,4].map((i) => (

            <div
              key={i}
              className="aspect-square bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-2xl border border-[#222]"
            />

          ))}

        </div>

      </section>


      {/* FEATURES */}
      <section className="border-t border-[#1a1a1a] py-24 px-6">

        <div className="max-w-6xl mx-auto text-center space-y-16">

          <h2 className="text-3xl md:text-4xl font-bold">
            Built for the AI generation era
          </h2>

          <div className="grid md:grid-cols-3 gap-12">

            <div className="space-y-4">

              <div className="text-4xl">📸</div>

              <h3 className="text-xl font-semibold">
                Upload
              </h3>

              <p className="text-gray-400 text-sm leading-relaxed">
                Upload a simple portrait photo to begin your AI transformation.
              </p>

            </div>


            <div className="space-y-4">

              <div className="text-4xl">🧠</div>

              <h3 className="text-xl font-semibold">
                Describe
              </h3>

              <p className="text-gray-400 text-sm leading-relaxed">
                Tell AI the style, scene, and atmosphere you want.
              </p>

            </div>


            <div className="space-y-4">

              <div className="text-4xl">✨</div>

              <h3 className="text-xl font-semibold">
                Transform
              </h3>

              <p className="text-gray-400 text-sm leading-relaxed">
                Generate cinematic AI portraits ready to share.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* SHOWCASE */}
      <section className="bg-[#0f0f14] py-24 px-6">

        <div className="max-w-6xl mx-auto text-center space-y-12">

          <h2 className="text-3xl md:text-4xl font-bold">
            AI Generated Personas
          </h2>

          <p className="text-gray-400 max-w-xl mx-auto">
            Every profile on Persona is powered by AI creativity.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {[1,2,3,4,5,6,7,8].map((i) => (

              <div
                key={i}
                className="aspect-square bg-gradient-to-br from-[#111] to-[#1c1c1c] rounded-2xl border border-[#222]"
              />

            ))}

          </div>

        </div>

      </section>


      {/* FINAL CTA */}
      <section className="py-24 text-center px-6">

        <div className="max-w-3xl mx-auto space-y-8">

          <h2 className="text-4xl font-bold">
            Start building your AI identity
          </h2>

          <p className="text-gray-400">
            Join the first AI-powered social network and
            create your Persona today.
          </p>

          <Link
            href="/signup"
            className="inline-block px-10 py-4 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition"
          >
            Join Persona
          </Link>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="text-center text-gray-500 text-sm py-10 border-t border-[#1a1a1a]">

        © {new Date().getFullYear()} Persona

      </footer>

    </main>
  );
}