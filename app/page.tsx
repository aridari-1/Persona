"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">

      {/* 🌌 ANIMATED BACKGROUND */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-120px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-500/20 blur-[120px] animate-pulse" />
        <div className="absolute right-[-80px] top-[180px] h-[260px] w-[260px] rounded-full bg-blue-500/20 blur-[120px] animate-pulse" />
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
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:scale-[1.05] active:scale-[0.98]"
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

          {/* 🔥 UPDATED HEADLINE */}
          <h1 className="text-[38px] font-semibold leading-[1.05] tracking-tight sm:text-6xl">

            You already have a Persona.

            <span className="mt-2 block bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              We just reveal it.
            </span>

          </h1>

          {/* SUBTEXT */}
          <p className="mx-auto mt-5 max-w-md text-[15px] text-white/55">
            One photo. A version of you the world hasn’t seen yet.
          </p>

          {/* CTA */}
          <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">

            <Link
              href="/signup"
              className="w-full sm:w-auto rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-[1.05] active:scale-[0.97]"
            >
              Reveal your Persona
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-sm text-white/80 transition hover:scale-[1.05] active:scale-[0.97]"
            >
              Login
            </Link>

          </div>

        </div>

        {/* 🔥 IMAGE SHOWCASE (UPGRADED) */}
        <div className="mt-16 grid w-full max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3">

          {/* IMAGE CARD */}
          {[
            "/before-persona.jpeg",
            "/after-persona.jpeg",
            "/before-persona-2.jpeg",
            "/after-persona-2.jpeg",
            "/before-persona-3.jpeg",
            "/after-persona-3.jpeg",
           
          ].map((src, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0b0b0d]"
            >

              <div className="relative aspect-[4/5]">

                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-110"
                />

                {/* GLOW OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-80" />

              </div>

            </div>
          ))}

        </div>

        {/* MICRO COPY */}
        <p className="mt-6 text-xs text-white/30">
          Real → Persona
        </p>

      </section>

      {/* 🔥 EXTRA SECTION (DEPTH + TRUST) */}
      <section className="relative z-10 mx-auto max-w-4xl px-5 pb-20 text-center">

        <h2 className="text-xl font-semibold text-white/90">
          Not just a photo.
        </h2>

        <p className="mt-3 text-white/50">
          A new way to express who you really are.
        </p>

      </section>

    </main>
  );
}