"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter your email and password.");
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

      // 🔥 Redirect into app shell
      // AppLayout will handle profile check + onboarding enforcement
      router.replace("/feed");

    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">

      <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl space-y-6 shadow-xl">

        <h1 className="text-3xl font-bold text-center neon-text">
          Welcome Back
        </h1>

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white focus:outline-none focus:border-purple-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white focus:outline-none focus:border-purple-500"
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
        <button
  onClick={() => router.push("/forgot-password")}
  className="text-sm text-gray-400"
>
  Forgot password?
</button>

      </div>

    </div>
  );
}