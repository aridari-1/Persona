"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /* -------------------------
     CHECK USER + PROFILE
  ------------------------- */

  useEffect(() => {

    const checkUserAndProfile = async () => {

      const { data: sessionRes } = await supabase.auth.getSession();
      const user = sessionRes.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, bio, onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      if (profile.onboarding_completed) {
        router.replace("/feed");
        return;
      }

      if (profile.username?.startsWith("user_")) {
        setUsername("");
      } else {
        setUsername(profile.username || "");
      }

      setDisplayName(
        profile.display_name === "New User" ? "" : profile.display_name || ""
      );

      setBio(profile.bio || "");

      setPageLoading(false);
    };

    checkUserAndProfile();

  }, [router]);

  /* -------------------------
     USERNAME VALIDATION
  ------------------------- */

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

  /* -------------------------
     SUBMIT
  ------------------------- */

  const handleSubmit = async () => {

    if (!usernameAvailable || !displayName || loading || checkingUsername) return;

    setLoading(true);
    setErrorMsg(null);

    try {

      const { data: sessionRes } = await supabase.auth.getSession();
      const user = sessionRes.session?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const cleanUsername = username.trim().toLowerCase();
      const cleanDisplayName = displayName.trim();
      const cleanBio = bio.trim();

      const { error } = await supabase
        .from("profiles")
        .update({
          username: cleanUsername,
          display_name: cleanDisplayName,
          bio: cleanBio,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw new Error(error.message);

      router.replace("/feed");

    } catch (err: any) {

      setErrorMsg(err?.message || "Something went wrong.");
      setLoading(false);

    }

  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-black px-6 text-white">

      <div className="w-full max-w-md space-y-8">

        {/* TITLE */}

        <div className="text-center space-y-2">

          <h1 className="text-3xl font-bold text-white">
            Set up your profile
          </h1>

          <p className="text-gray-400 text-sm">
            Choose a username and tell people who you are.
          </p>

        </div>

        {/* ERROR */}

        {errorMsg && (

          <div className="bg-red-900/20 border border-red-700 text-red-200 text-sm p-3 rounded-lg">
            {errorMsg}
          </div>

        )}

        {/* USERNAME */}

        <div className="space-y-2">

          <label className="text-sm text-gray-300">
            Username
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 !text-white"
            style={{ WebkitTextFillColor: "#ffffff" }}
            placeholder="your_username"
          />

          <p className="text-xs text-gray-500">
            3–20 characters. Letters, numbers and underscores only.
          </p>

          {checkingUsername && (
            <p className="text-xs text-gray-400">
              Checking availability...
            </p>
          )}

          {usernameAvailable === false && (
            <p className="text-xs text-red-500">
              Username invalid or already taken.
            </p>
          )}

          {usernameAvailable === true && (
            <p className="text-xs text-green-500">
              Username available ✓
            </p>
          )}

        </div>

        {/* DISPLAY NAME */}

        <div className="space-y-2">

          <label className="text-sm text-gray-300">
            Display Name
          </label>

          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 !text-white"
            style={{ WebkitTextFillColor: "#ffffff" }}
            placeholder="Your name"
          />

        </div>

        {/* BIO */}

        <div className="space-y-2">

          <label className="text-sm text-gray-300">
            Bio (optional)
          </label>

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={150}
            className="w-full p-3 rounded-lg bg-[#111] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none !text-white"
            style={{ WebkitTextFillColor: "#ffffff" }}
            placeholder="Tell people about yourself..."
          />

          <p className="text-xs text-gray-500 text-right">
            {bio.length}/150
          </p>

        </div>

        {/* SUBMIT */}

        <button
          onClick={handleSubmit}
          disabled={!usernameAvailable || !displayName || loading || checkingUsername}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
        >
          {loading ? "Saving..." : "Finish Setup"}
        </button>

      </div>

    </div>

  );

}