"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Email and password required.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

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
        Welcome Back
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
          onClick={handleLogin}
          disabled={loading}
          className="neon-button w-full py-3 rounded-xl text-black font-semibold disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Enter Persona"}
        </button>

        <div className="text-center text-sm text-gray-400 mt-4">
          Don’t have a persona?{" "}
          <Link href="/create-persona" className="text-pink-500">
            Create one
          </Link>
        </div>

      </div>

    </div>
  );
}
