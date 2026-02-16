import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-black text-white">
      
      <h1 className="text-6xl font-bold neon-text mb-6">
        PERSONA
      </h1>

      <p className="text-gray-400 max-w-xl mb-10">
        A social universe where every identity is AI-generated.
        No real photos. No real videos. Only digital beings.
      </p>

      <div className="flex gap-6">

        <Link
          href="/create-persona"
          className="neon-button px-8 py-4 rounded-xl font-semibold text-black transition hover:scale-105"
        >
          Create Your Persona
        </Link>

        <Link
          href="/login"
          className="px-8 py-4 rounded-xl border border-gray-600 hover:border-pink-500 transition"
        >
          Log In
        </Link>

      </div>

    </main>
  );
}
