"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  // NEW: avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [checking, setChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if profile already exists
  useEffect(() => {
    const checkProfile = async () => {
      const { data: session } = await supabase.auth.getSession();
      const user = session.session?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (profile) {
        router.push("/feed");
      }
    };

    checkProfile();
  }, [router]);

  // Username validation + availability check
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

  // NEW: handle avatar file change
  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);

    if (!file) {
      setAvatarPreview(null);
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
  };

  // NEW: upload avatar and return public URL
  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return null;

    const path = `${userId}/avatar.png`;

    const { error: uploadError } = await supabase.storage
      .from("persona-avatars")
      .upload(path, avatarFile, {
        upsert: true,
        contentType: avatarFile.type || "image/png",
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from("persona-avatars")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!usernameAvailable || !displayName) return;

    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    // NEW: upload avatar first (optional)
    const avatarUrl = await uploadAvatar(user.id);

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      username,
      display_name: displayName,
      persona_name: "Persona",
      bio,
      avatar_url: avatarUrl, // NEW
    });

    if (error) {
      console.error("Profile insert error:", error.message);
      setLoading(false);
      return;
    }

    router.push("/feed");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-md space-y-6">

        <h1 className="text-2xl font-bold text-center">
          Welcome to <span className="text-purple-500">Persona</span>
        </h1>

        {/* NEW: Avatar Upload */}
        <div className="space-y-3">
          <label className="text-sm text-gray-400">Profile Photo (optional)</label>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#111] border border-gray-800 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-xs text-gray-500">No photo</span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              className="text-sm text-gray-400"
              onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

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