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
      alert("Enter email and password.");
      return;
    }

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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">

      <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl space-y-6">

        <h1 className="text-3xl font-bold text-center neon-text">
          Welcome Back
        </h1>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="neon-button w-full py-3 rounded-xl text-black font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

        <div className="text-center text-gray-400 text-sm">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-white hover:underline">
            Sign up
          </Link>
        </div>

      </div>

    </div>
  );
}