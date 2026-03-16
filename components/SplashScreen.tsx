"use client";

import Image from "next/image";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-between z-[9999]">

      {/* CENTER LOGO */}
      <div className="flex-1 flex items-center justify-center">
        <Image
          src="/persona-logo.png"
          alt="Persona"
          width={120}
          height={120}
          priority
        />
      </div>

      {/* BRAND NAME BOTTOM */}
      <div className="pb-10 text-center">
        <p className="text-gray-500 text-sm tracking-widest">
          Persona
        </p>
      </div>

    </div>
  );
}