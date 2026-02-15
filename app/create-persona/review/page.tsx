"use client";

import { useEffect, useState } from "react";

export default function ReviewPersona() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [personaData, setPersonaData] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingPersona");

    if (!stored) {
      window.location.href = "/create-persona";
      return;
    }

    const data = JSON.parse(stored);
    setPersonaData(data);
    setAvatar(data.avatar_url);
  }, []);

  const handleContinue = () => {
    if (!username) {
      alert("Username is required.");
      return;
    }

    const updated = {
      ...personaData,
      username,
      bio,
    };

    sessionStorage.setItem("pendingPersona", JSON.stringify(updated));

    window.location.href = "/auth";
  };

  if (!avatar) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-black text-white">

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
          className="neon-button px-8 py-3 rounded-xl text-black font-semibold w-full"
        >
          Continue to Sign Up
        </button>

      </div>

    </div>
  );
}
