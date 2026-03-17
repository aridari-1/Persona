"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">

      {/* SOFT BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-100px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute right-[-60px] top-[160px] h-[240px] w-[240px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* NAVBAR */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link
            href="/"
            className="text-[13px] font-semibold tracking-[0.35em] text-white/90"
          >
            PERSONA
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-2 text-sm text-white/60 transition hover:text-white"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition active:scale-[0.98]"
            >
              Start
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-70px)] max-w-6xl flex-col items-center justify-center px-5 pb-12 pt-4 text-center">

        <div className="max-w-2xl">

          {/* SMALL TAG */}
          <p className="mb-5 text-xs text-white/40">
            AI identity
          </p>

          {/* HEADLINE */}
          <h1 className="text-[38px] font-semibold leading-[1.05] tracking-tight sm:text-6xl">

            Upload a photo.

            <span className="mt-2 block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Become your Persona.
            </span>

          </h1>

          {/* SUBTEXT */}
          <p className="mx-auto mt-5 max-w-md text-[15px] text-white/55">
            One photo. A new identity.
          </p>

          {/* CTA */}
          <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">

            <Link
              href="/signup"
              className="w-full sm:w-auto rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition active:scale-[0.97]"
            >
              Create Persona
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-white/80 transition active:scale-[0.97]"
            >
              Login
            </Link>

          </div>

        </div>

        {/* BEFORE / AFTER */}
        <div className="mt-14 grid w-full max-w-4xl gap-4 sm:grid-cols-2">

          {/* BEFORE */}
          <div className="rounded-[24px] border border-white/10 bg-[#0b0b0d] p-2">
            <div className="mb-2 px-2 text-xs text-white/50">
              Before
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[18px]">
              <Image
                src="/before-persona.jpeg"
                alt="Before"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>

          {/* AFTER */}
          <div className="rounded-[24px] border border-white/10 bg-[#0b0b0d] p-2">
            <div className="mb-2 px-2 text-xs text-white/50">
              After
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[18px]">
              <Image
                src="/after-persona.jpeg"
                alt="After"
                fill
                priority
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            </div>
          </div>

        </div>

        {/* MICRO COPY */}
        <p className="mt-5 text-xs text-white/30">
          Photo → Persona
        </p>

      </section>
    </main>
  );
}