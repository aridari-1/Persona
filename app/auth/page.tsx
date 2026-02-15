"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Ensure user is logged in (anonymous)
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // No anonymous session → send back to persona creation
        window.location.href = "/create-persona";
      }
    };

    checkUser();
  }, []);

  const handleUpgrade = async () => {
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      // Success → account upgraded
      window.location.href = "/feed";

    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
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
          onClick={handleUpgrade}
          disabled={loading}
          className="neon-button w-full py-3 rounded-xl text-black font-semibold disabled:opacity-50"
        >
          {loading ? "Upgrading..." : "Secure & Enter Persona"}
        </button>

      </div>
    </div>
  );
}
