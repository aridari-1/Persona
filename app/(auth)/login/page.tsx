"use client";

import { Suspense } from "react";
import LoginInner from "./LoginInner";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-black">

          <div className="flex flex-col items-center space-y-4 text-gray-400">

            <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

            <p className="text-sm">
              Loading login...
            </p>

          </div>

        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
