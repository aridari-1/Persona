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

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Account created. Please log in.");
        return;
      }

      const pending = sessionStorage.getItem("pendingPersona");

      if (!pending) {
        alert("No persona data found.");
        return;
      }

      const personaData = JSON.parse(pending);

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
    <div className="min-h-[100dvh] flex items-center justify-center bg-black px-5 py-10">

      <div className="w-full max-w-md">

        {/* Logo / Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            PERSONA
          </h1>
          <p className="text-gray-400 text-sm mt-3">
            Secure your identity and enter your world
          </p>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-6 shadow-2xl">

          <div className="space-y-4">

            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a strong password"
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-purple-500 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl font-semibold text-black bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 shadow-lg hover:scale-[1.02] transition disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up & Enter Persona"}
            </button>

          </div>

        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to Persona's Terms & Privacy.
        </div>

      </div>
    </div>
  );
}
