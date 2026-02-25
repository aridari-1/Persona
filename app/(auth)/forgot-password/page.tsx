"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) return alert("Enter your email");

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSent(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reset Password</h1>

      {!sent ? (
        <>
          <input
            type="email"
            placeholder="Your email"
            className="w-full bg-black border border-gray-800 p-3 rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-white text-black py-3 rounded-lg font-semibold"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </>
      ) : (
        <p className="text-gray-400">
          Check your email for password reset instructions.
        </p>
      )}
    </div>
  );
}