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

  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {

    if (loading) return;

    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must contain at least 6 characters.");
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

      // Redirect to login and tell the user to verify email
      router.replace("/login?verify=true");

    } catch (err) {

      console.error(err);

      setErrorMsg("Something went wrong. Please try again.");
      setLoading(false);

    }

  };

  return (

    <div className="min-h-dvh flex items-center justify-center bg-black px-6">

      <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl space-y-6 border border-[#1a1a1a]">

        <div className="text-center space-y-2">

          <h1 className="text-3xl font-bold neon-text">
            Join Persona
          </h1>

          <p className="text-gray-400 text-sm">
            Create your AI persona and share it with the world.
          </p>

        </div>

        {errorMsg && (

          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg text-center">
            {errorMsg}
          </div>

        )}

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email address"
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white placeholder-gray-500 focus:border-purple-500 outline-none disabled:opacity-50"
          />

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white placeholder-gray-500 focus:border-purple-500 outline-none disabled:opacity-50"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>

          </div>

          <p className="text-xs text-gray-500">
            Password should contain at least 6 characters.
          </p>

          <div className="flex justify-center pt-2">

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
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </div>

        <div className="text-center text-gray-400 text-sm space-y-2">

          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-white hover:underline">
              Login
            </Link>
          </p>

          <p className="text-xs text-gray-500">
            By signing up you agree to our Terms and Privacy Policy.
          </p>

        </div>

      </div>

    </div>

  );

}