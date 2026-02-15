"use client";

import { useState, useEffect } from "react";
import { personaStyles } from "@/lib/personaStyles";
import { supabase } from "@/lib/supabaseClient";

export default function CreatePersona() {
  const [archetype, setArchetype] = useState("");
  const [style, setStyle] = useState("");
  const [mood, setMood] = useState("balanced");
  const [loading, setLoading] = useState(false);

  // 🔥 Ensure anonymous session exists
  useEffect(() => {
    const ensureSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        await supabase.auth.signInAnonymously();
      }
    };

    ensureSession();
  }, []);

  const handleGenerate = async () => {
    if (!archetype || !style) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Failed to create anonymous session.");
        return;
      }

      const res = await fetch("/api/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archetype, style, mood }),
      });

      const data = await res.json();

      if (!data.avatar_url) {
        alert("Generation failed.");
        return;
      }

      // 🔥 Save immediately to profiles
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        persona_name: `${archetype}-${Date.now()}`,
        username: `persona_${Date.now()}`,
        avatar_url: data.avatar_url,
        persona_dna: data.persona_dna,
      });

      if (error) {
        alert("Failed to save persona.");
        return;
      }

      // Redirect to feed immediately
      window.location.href = "/feed";

    } catch (error) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">

      <h2 className="text-4xl neon-text mb-10">
        Forge Your Identity
      </h2>

      <div className="glass-card p-8 rounded-2xl w-full max-w-xl space-y-6">

        <div>
          <label className="block mb-2 text-gray-400">Archetype</label>
          <input
            className="w-full p-3 bg-black border border-gray-700 rounded-lg"
            placeholder="Student Creator, Tech Founder..."
            value={archetype}
            onChange={(e) => setArchetype(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 text-gray-400">Style</label>
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
          <label className="block mb-2 text-gray-400">Mood</label>
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
