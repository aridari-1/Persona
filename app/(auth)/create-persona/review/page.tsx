"use client";

import { useEffect, useState } from "react";

type PersonaOption = {
  avatar_url: string;
  persona_dna: any;
};

type PendingPersona = {
  options: PersonaOption[];
  selectedIndex: number | null;
  username?: string;
  bio?: string;
};

export default function ReviewPersona() {
  const [personaData, setPersonaData] = useState<PendingPersona | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingPersona");

    if (!stored) {
      window.location.href = "/create-persona";
      return;
    }

    const parsed: PendingPersona = JSON.parse(stored);

    if (!parsed.options || parsed.options.length === 0) {
      window.location.href = "/create-persona";
      return;
    }

    setPersonaData(parsed);
    setSelectedIndex(parsed.selectedIndex);
  }, []);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleContinue = () => {
    if (selectedIndex === null) {
      alert("Please select one avatar.");
      return;
    }

    if (!username) {
      alert("Username is required.");
      return;
    }

    if (!personaData) return;

    const updated: PendingPersona = {
      ...personaData,
      selectedIndex,
      username,
      bio,
    };

    sessionStorage.setItem("pendingPersona", JSON.stringify(updated));

    window.location.href = "/auth";
  };

  if (!personaData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-black text-white">

      <h2 className="text-4xl neon-text mb-8">
        Choose Your Identity
      </h2>

      <div className="glass-card p-8 rounded-2xl w-full max-w-md">

        {/* Avatar Options */}
        <div className="flex flex-col gap-6 mb-8">
          {personaData.options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleSelect(index)}
              className={`cursor-pointer border-2 rounded-xl p-2 transition ${
                selectedIndex === index
                  ? "border-cyan-400"
                  : "border-gray-800"
              }`}
            >
              <img
                src={option.avatar_url}
                alt="Persona Option"
                className="w-full h-64 rounded-lg object-cover"
              />
            </div>
          ))}
        </div>

        {/* Username */}
        <input
          placeholder="Choose a username"
          className="w-full p-3 bg-black border border-gray-700 rounded-lg mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* Bio */}
        <textarea
          placeholder="Write a bio (optional)"
          className="w-full p-3 bg-black border border-gray-700 rounded-lg mb-6"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        {/* Continue */}
        <button
          onClick={handleContinue}
          disabled={selectedIndex === null}
          className="neon-button px-8 py-3 rounded-xl text-black font-semibold w-full disabled:opacity-50"
        >
          Continue to Sign Up
        </button>

      </div>
    </div>
  );
}