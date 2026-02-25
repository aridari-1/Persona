"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  // Form state
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  // Validation state
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🔐 Check if user already has a profile
  useEffect(() => {
    const checkProfile = async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      const user = sessionRes.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        router.replace("/feed");
      }
    };

    checkProfile();
  }, [router]);

  // 🔎 Username validation + availability check
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }

    const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

    if (!isValid) {
      setUsernameAvailable(false);
      return;
    }

    const checkAvailability = async () => {
      setCheckingUsername(true);

      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      setUsernameAvailable(!data);
      setCheckingUsername(false);
    };

    const delay = setTimeout(checkAvailability, 400);
    return () => clearTimeout(delay);
  }, [username]);

  // 🚀 Create profile
  const handleSubmit = async () => {
    if (!usernameAvailable || !displayName || loading) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const user = sessionRes.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        username,
        display_name: displayName,
        bio,
        avatar_url: null,
      });

      if (error) {
        throw new Error(error.message);
      }

      router.replace("/feed");

    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-md space-y-8">

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            Create your profile
          </h1>
          <p className="text-gray-400 text-sm">
            This is how people will see you on Persona.
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="border border-red-700 bg-red-900/20 text-red-200 text-sm p-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="w-full p-3 rounded-lg bg-[#111] border border-gray-800 focus:outline-none focus:border-purple-500"
            placeholder="choose_a_username"
          />

          <p className="text-xs text-gray-500">
            3–20 characters. Letters, numbers, and underscores only.
          </p>

          {checkingUsername && (
            <p className="text-xs text-gray-400">
              Checking username availability…
            </p>
          )}

          {usernameAvailable === false && (
            <p className="text-xs text-red-500">
              This username is invalid or already taken.
            </p>
          )}

          {usernameAvailable === true && (
            <p className="text-xs text-green-500">
              Username is available.
            </p>
          )}
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-gray-800 focus:outline-none focus:border-purple-500"
            placeholder="Your name"
          />
          <p className="text-xs text-gray-500">
            This is your public name. It doesn’t need to be unique.
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">
            Bio (optional)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-gray-800 focus:outline-none focus:border-purple-500 resize-none"
            rows={3}
            maxLength={150}
            placeholder="Tell people a little about yourself…"
          />
          <p className="text-xs text-gray-500">
            Max 150 characters.
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!usernameAvailable || !displayName || loading}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
        >
          {loading ? "Creating your profile…" : "Complete setup"}
        </button>

      </div>
    </div>
  );
}