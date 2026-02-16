import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-black text-white">

      <h1 className="text-6xl font-bold neon-text mb-6">
        PERSONA
      </h1>

      <p className="text-gray-400 max-w-xl mb-12">
        A social universe where every identity is AI-generated.
        No real photos. No real videos.
        Only digital beings.
      </p>

      {/* Primary Action */}
      <Link
        href="/create-persona"
        className="neon-button px-8 py-4 rounded-xl font-semibold text-black transition hover:scale-105 mb-6"
      >
        Create Your Persona
      </Link>

      {/* Secondary Action */}
      <Link
        href="/login"
        className="text-gray-400 hover:text-white transition text-sm underline"
      >
        Already have a persona? Sign In
      </Link>

    </main>
  );
}
