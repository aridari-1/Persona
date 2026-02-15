"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      // 🔥 Create real auth user
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      // 🔥 Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Account created. Please log in.");
        return;
      }

      // 🔥 Get pending persona from sessionStorage
      const pending = sessionStorage.getItem("pendingPersona");

      if (!pending) {
        alert("No persona data found.");
        return;
      }

      const personaData = JSON.parse(pending);

      // 🔥 Finalize persona in DB
      const res = await fetch("/api/finalize-persona", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(personaData),
      });

      if (!res.ok) {
        alert("Failed to save persona.");
        return;
      }

      sessionStorage.removeItem("pendingPersona");

      window.location.href = "/feed";

    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-black text-white">
      <h2 className="text-4xl neon-text mb-8">
        Secure Your Persona
      </h2>

      <div className="glass-card p-8 rounded-2xl w-full max-w-md space-y-4">

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 bg-black border border-gray-700 rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 bg-black border border-gray-700 rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="neon-button w-full py-3 rounded-xl text-black font-semibold disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Sign Up & Enter Persona"}
        </button>

      </div>
    </div>
  );
}
