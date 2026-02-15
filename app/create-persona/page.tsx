"use client";

import { useState } from "react";
import { personaStyles } from "@/lib/personaStyles";

export default function CreatePersona() {
  const [archetype, setArchetype] = useState("");
  const [style, setStyle] = useState("");
  const [mood, setMood] = useState("balanced");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!archetype || !style) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/generate-persona", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archetype, style, mood }),
      });

      const data = await res.json();

      if (!data.avatar_url) {
        alert("Generation failed.");
        return;
      }

      // 🔥 Store persona temporarily (NOT in database)
      sessionStorage.setItem(
        "pendingPersona",
        JSON.stringify(data)
      );

      // 🔥 Go to review page
      window.location.href = "/create-persona/review";

    } catch (error) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-black text-white">

      <h2 className="text-4xl neon-text mb-10">
        Forge Your Identity
      </h2>

      <div className="glass-card p-8 rounded-2xl w-full max-w-xl space-y-6">

        <div>
          <label className="block mb-2 text-gray-400">
            Archetype
          </label>
          <input
            className="w-full p-3 bg-black border border-gray-700 rounded-lg"
            placeholder="Student Creator, Tech Founder..."
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 text-gray-400">
            Style
          </label>
          <select
            className="w-full p-3 bg-black border border-gray-700 rounded-lg"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option value="">Select Style</option>
            {personaStyles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 text-gray-400">
            Mood
          </label>
          <select
            className="w-full p-3 bg-black border border-gray-700 rounded-lg"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          >
            <option value="calm">Calm</option>
            <option value="balanced">Balanced</option>
            <option value="intense">Intense</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="neon-button w-full py-3 rounded-xl text-black font-semibold hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Persona"}
        </button>

      </div>
    </div>
  );
}
