"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  // 🔥 IMPORTANT: hydrate recovery session
  useEffect(() => {
    const init = async () => {
      await supabase.auth.getSession();
    };
    init();
  }, []);

  const handleUpdate = async () => {
    if (!password) return;

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setDone(true);

    // optional: redirect after 2 seconds
    setTimeout(() => {
      router.replace("/login");
    }, 2000);
  };

  if (done) {
    return (
      <p className="text-center mt-10">
        Password updated successfully. Redirecting to login...
      </p>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6">
      <div className="w-full max-w-md bg-[#111] p-8 rounded-2xl space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Create New Password
        </h1>

        <input
          type="password"
          placeholder="New password"
          className="w-full bg-black border border-gray-800 p-3 rounded-lg text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleUpdate}
          className="w-full bg-white text-black py-3 rounded-lg font-semibold"
        >
          Update Password
        </button>
      </div>
    </div>
  );
}