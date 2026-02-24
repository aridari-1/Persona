"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setUsername(data.username || "");
      setDisplayName(data.display_name || "");
      setBio(data.bio || "");
      setAvatarPreview(data.avatar_url || null);
    }

    setLoading(false);
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSave = async () => {
    setSaving(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;
    const token = session.session?.access_token;

    if (!user || !token) {
      router.push("/login");
      return;
    }

    // 🔥 1️⃣ If avatar selected → generate AI avatar FIRST
    if (avatarFile) {
      try {
        setGeneratingAvatar(true);

        const dataUrl = await fileToDataUrl(avatarFile);

        const res = await fetch("/api/transform-avatar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            inputDataUrl: dataUrl,
          }),
        });

        const result = await res.json();

        if (!res.ok) {
          alert(result.error || "Avatar generation failed");
          setSaving(false);
          setGeneratingAvatar(false);
          return;
        }

        // Update preview with AI result
        if (result.avatar_url) {
          setAvatarPreview(result.avatar_url);
        }

        setGeneratingAvatar(false);
      } catch (err) {
        console.error(err);
        alert("Avatar error");
        setSaving(false);
        setGeneratingAvatar(false);
        return;
      }
    }

    // 🔥 2️⃣ Update text fields AFTER avatar
    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        display_name: displayName,
        bio,
      })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    router.push("/profile/me");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 max-w-xl mx-auto mt-8 space-y-8">

      <h1 className="text-2xl font-bold">Edit Profile</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center space-y-4">
        <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-700">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-sm">
              No Avatar
            </div>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setAvatarFile(file);
            if (file) {
              setAvatarPreview(URL.createObjectURL(file));
            }
          }}
          className="text-sm"
        />

        {generatingAvatar && (
          <p className="text-xs text-purple-400">
            Generating AI avatar...
          </p>
        )}

        <p className="text-xs text-gray-500 text-center">
          Upload a photo — it will be transformed into your AI avatar.
        </p>
      </div>

      {/* Username */}
      <div>
        <label className="text-sm text-gray-400">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-lg p-3 mt-1"
        />
      </div>

      {/* Display Name */}
      <div>
        <label className="text-sm text-gray-400">Display Name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-lg p-3 mt-1"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="text-sm text-gray-400">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full bg-black border border-gray-800 rounded-lg p-3 mt-1"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full neon-button py-3 rounded-xl text-black font-semibold"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

    </div>
  );
}