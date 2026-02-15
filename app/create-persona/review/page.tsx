"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ReviewPersona() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/create-persona";
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, username, bio")
        .eq("id", user.id)
        .single();

      if (data) {
        setAvatar(data.avatar_url);
        setUsername(data.username || "");
        setBio(data.bio || "");
      }
    };

    loadProfile();
  }, []);

  const handleContinue = async () => {
    if (!username) {
      alert("Username is required.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("User not authenticated.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          bio,
        })
        .eq("id", user.id);

      if (error) {
        alert(error.message);
        return;
      }

      // 🔥 Go to feed after profile completion
      window.location.href = "/feed";

    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!avatar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">

      <h2 className="text-4xl neon-text mb-8">
        Complete Your Persona
      </h2>

      <div className="glass-card p-8 rounded-2xl text-center w-full max-w-md">

        <img
          src={avatar}
          alt="Persona Avatar"
          className="w-64 h-64 rounded-xl mb-6 object-cover mx-auto"
        />

        <input
          placeholder="Choose a username"
          className="w-full p-3 bg-black border border-gray-700 rounded-lg mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <textarea
          placeholder="Write a bio (optional)"
          className="w-full p-3 bg-black border border-gray-700 rounded-lg mb-6"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <button
          onClick={handleContinue}
          disabled={loading}
          className="neon-button px-8 py-3 rounded-xl text-black font-semibold w-full"
        >
          {loading ? "Saving..." : "Continue"}
        </button>

      </div>

    </div>
  );
}
