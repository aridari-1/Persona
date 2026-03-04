"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Turnstile from "react-turnstile";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignup = async () => {
    if (loading) return;

    if (!email || !password) {
      setErrorMsg("Enter email and password.");
      return;
    }

    if (!captchaToken) {
      setErrorMsg("Please complete the verification.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          captchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Signup failed.");
        setLoading(false);
        return;
      }

      router.replace("/onboarding");

    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl space-y-6">

        <h1 className="text-3xl font-bold text-center neon-text">
          Join Persona
        </h1>

        {errorMsg && (
          <div className="text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white disabled:opacity-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            disabled={loading}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white disabled:opacity-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Turnstile */}
          <div className="flex justify-center">
            <Turnstile
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onVerify={(token) => setCaptchaToken(token)}
              theme="dark"
            />
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="neon-button w-full py-3 rounded-xl text-black font-semibold disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

        </div>

        <div className="text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline">
            Login
          </Link>
        </div>

      </div>
    </div>
  );
}