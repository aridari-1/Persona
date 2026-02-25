"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const [checking, setChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirect if profile already exists
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

  // Username availability check
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
      setChecking(true);

      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      setUsernameAvailable(!data);
      setChecking(false);
    };

    const delay = setTimeout(checkAvailability, 400);
    return () => clearTimeout(delay);
  }, [username]);

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
        persona_name: "Persona",
        bio,
        avatar_url: null,
      });

      if (error) {
        throw new Error(error.message);
      }

      router.replace("/feed");

    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-md space-y-6">

        <h1 className="text-2xl font-bold text-center">
          Set up your Persona
        </h1>

        {errorMsg && (
          <div className="border border-red-700 bg-red-900/20 text-red-200 text-sm p-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="w-full p-3 rounded-lg bg-[#111] border border-gray-800 focus:outline-none focus:border-purple-500"
            placeholder="your_username"
          />

          {checking && (
            <p className="text-xs text-gray-500">Checking availability...</p>
          )}
          {usernameAvailable === false && (
            <p className="text-xs text-red-500">
              Username invalid or already taken
            </p>
          )}
          {usernameAvailable === true && (
            <p className="text-xs text-green-500">
              Username available
            </p>
          )}
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-gray-800 focus:outline-none focus:border-purple-500"
            placeholder="Your Name"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Bio (optional)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-gray-800 focus:outline-none focus:border-purple-500 resize-none"
            rows={3}
            maxLength={150}
            placeholder="Tell the world who you are..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!usernameAvailable || !displayName || loading}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
        >
          {loading ? "Creating profile..." : "Complete Setup"}
        </button>

      </div>
    </div>
  );
}