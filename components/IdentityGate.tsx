"use client";

import { useApp } from "@/app/providers/AppProvider";


export default function IdentityGate() {
  const { loading, statusMessage } = useApp();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black">

      {/* Soft radial glow */}
      <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-4xl font-bold tracking-widest mb-6 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent animate-pulse">
          PERSONA
        </div>

        <p className="text-sm text-gray-400 tracking-wide">
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
