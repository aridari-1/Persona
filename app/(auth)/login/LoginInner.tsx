"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginInner() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const initialVerify = searchParams.get("verify");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(
    initialVerify
      ? "Account created. Please check your email to verify before logging in."
      : null
  );

  const [showResend, setShowResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {

    if (loading) return;

    if (!email || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    try {

      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      setShowResend(false);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {

        if (error.message === "Email not confirmed") {

          setErrorMsg(
            "Please verify your email before logging in. Check your inbox for the confirmation link."
          );

          setShowResend(true);

        } else {

          setErrorMsg(error.message);

        }

        setLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMsg("Login failed.");
        setLoading(false);
        return;
      }

      /* ------------------------------------
         CHECK IF ONBOARDING IS COMPLETE
      ------------------------------------ */

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error(profileError);
        setErrorMsg("Could not load profile.");
        setLoading(false);
        return;
      }

      if (!profile?.onboarding_completed) {
        router.replace("/onboarding");
      } else {
        router.replace("/feed");
      }

    } catch (err) {

      console.error("Login error:", err);

      setErrorMsg("Something went wrong.");
      setLoading(false);

    }

  };

  const resendConfirmation = async () => {

    if (!email) {
      setErrorMsg("Enter your email first.");
      return;
    }

    try {

      setResending(true);

      await supabase.auth.resend({
        type: "signup",
        email,
      });

      setSuccessMsg("Verification email resent. Please check your inbox.");
      setShowResend(false);

    } catch (err) {

      setErrorMsg("Could not resend email.");

    }

    setResending(false);

  };

  return (

    <div className="min-h-dvh flex items-center justify-center bg-black px-6">

      <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl space-y-6 border border-[#1a1a1a]">

        <div className="text-center space-y-2">

          <h1 className="text-3xl font-bold neon-text">
            Welcome Back
          </h1>

          <p className="text-gray-400 text-sm">
            Log in to continue to Persona.
          </p>

        </div>

        {successMsg && (

          <div className="bg-green-900/30 border border-green-600 text-green-300 text-sm p-3 rounded-lg text-center">
            {successMsg}
          </div>

        )}

        {errorMsg && (

          <div className="bg-red-900/30 border border-red-600 text-red-300 text-sm p-3 rounded-lg text-center">
            {errorMsg}
          </div>

        )}

        <div className="space-y-4">

          <input
            type="email"
            placeholder="Email address"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full p-3 rounded-lg bg-black border border-gray-800 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-xs text-gray-400"
            >
              {showPassword ? "Hide" : "Show"}
            </button>

          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="neon-button w-full py-3 rounded-xl text-black font-semibold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

        {showResend && (

          <button
            onClick={resendConfirmation}
            disabled={resending}
            className="text-xs text-purple-400 hover:underline text-center w-full"
          >
            {resending
              ? "Sending..."
              : "Resend confirmation email"}
          </button>

        )}

        <div className="text-center text-gray-400 text-sm space-y-2">

          <p>

            Don’t have an account?{" "}
            <Link href="/signup" className="text-white hover:underline">
              Sign up
            </Link>

          </p>

          <button
            onClick={() => router.push("/forgot-password")}
            className="text-sm text-gray-400 hover:text-white"
          >
            Forgot password?
          </button>

        </div>

      </div>

    </div>

  );

}