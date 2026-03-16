"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute right-[-80px] top-[180px] h-[280px] w-[280px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-80px] h-[280px] w-[280px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* navbar */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-[0.28em] text-white"
          >
            PERSONA
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm text-white/70 transition hover:text-white"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-8 text-center">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-white/60">
            AI social identity
          </p>

          <h1 className="text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl">
            Upload your photo.
            <span className="mt-2 block bg-gradient-to-r from-fuchsia-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Become your Persona.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
            Create a cinematic AI version of yourself and share it instantly.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Create Persona
            </Link>

            <Link
              href="/login"
              className="inline-flex min-w-[140px] items-center justify-center rounded-full border border-white/12 bg-white/[0.02] px-7 py-3 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
            >
              Login
            </Link>
          </div>
        </div>

        {/* before / after visual */}
        <div className="mt-16 grid w-full max-w-5xl gap-5 md:grid-cols-2">
          {/* before */}
          <div className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-sm font-medium text-white/85">Before</span>
              <span className="rounded-full bg-white/8 px-3 py-1 text-[11px] text-white/50">
                Original
              </span>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#0f0f12]">
              <Image
                src="/before-persona.jpg"
                alt="Original portrait before AI transformation"
                fill
                priority
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>

          {/* after */}
          <div className="group rounded-[28px] border border-white/10 bg-white/[0.03] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-sm font-medium text-white/85">After</span>
              <span className="rounded-full bg-gradient-to-r from-fuchsia-500/20 to-blue-500/20 px-3 py-1 text-[11px] text-white/70">
                AI Persona
              </span>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#0f0f12]">
              <Image
                src="/after-persona.jpg"
                alt="AI transformed portrait"
                fill
                priority
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm text-white/40">
          Simple photo in. Cinematic Persona out.
        </p>
      </section>
    </main>
  );
}