"use client";

import { Suspense } from "react";
import LoginInner from "./LoginInner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}