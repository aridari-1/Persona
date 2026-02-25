"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setDone(true);
  };

  if (done) {
    return <p>Password updated successfully. You can log in now.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Password</h1>

      <input
        type="password"
        placeholder="New password"
        className="w-full bg-black border border-gray-800 p-3 rounded-lg"
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
  );
}