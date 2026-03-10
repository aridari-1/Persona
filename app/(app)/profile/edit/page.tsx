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

  const [remaining, setRemaining] = useState<number | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchRemaining();
  }, []);

  // ===============================
  // Restore avatar generation
  // ===============================
  useEffect(() => {

    const restoreJob = async () => {

      const savedJob = localStorage.getItem("active_avatar_job");

      if (!savedJob) return;

      const { data: job } = await supabase
        .from("generation_jobs")
        .select("status, output_path")
        .eq("id", savedJob)
        .single();

      if (!job) return;

      if (job.status === "completed" && job.output_path) {

        const { data } = supabase.storage
          .from("persona-avatars")
          .getPublicUrl(job.output_path);

        setAvatarPreview(`${data.publicUrl}?v=${Date.now()}`);

        localStorage.removeItem("active_avatar_job");
        return;
      }

      if (job.status === "failed") {
        localStorage.removeItem("active_avatar_job");
        setGeneratingAvatar(false);
        return;
      }

      setJobId(savedJob);
      setGeneratingAvatar(true);
    };

    restoreJob();

  }, []);

  // ===============================
  // realtime avatar updates
  // ===============================
  useEffect(() => {

    if (!jobId) return;

    const channel = supabase
      .channel(`avatar-job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "generation_jobs",
          filter: `id=eq.${jobId}`,
        },
        async (payload) => {

          const job = payload.new as {
            status: string;
            output_path: string | null;
          };

          if (job.status === "completed" && job.output_path) {

            localStorage.removeItem("active_avatar_job");

            const { data } = supabase.storage
              .from("persona-avatars")
              .getPublicUrl(job.output_path);

            setAvatarPreview(`${data.publicUrl}?v=${Date.now()}`);

            setGeneratingAvatar(false);
          }

          if (job.status === "failed") {

            localStorage.removeItem("active_avatar_job");

            alert("Avatar generation failed.");

            setGeneratingAvatar(false);
          }

        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, [jobId]);

  const fetchRemaining = async () => {

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) return;

    const res = await fetch("/api/usage", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await res.json();

    if (res.ok) {
      setRemaining(result.remaining);
    }
  };

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

  // ===============================
  // generate avatar
  // ===============================
  const handleGenerateAvatar = async () => {

    if (!avatarFile) return;

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      router.push("/login");
      return;
    }

    try {

      setGeneratingAvatar(true);

      const dataUrl = await fileToDataUrl(avatarFile);

      const permissionRes = await fetch("/api/request-generation", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const permissionData = await permissionRes.json();

      if (!permissionRes.ok) {
        alert(permissionData.error || "Generation blocked");
        setGeneratingAvatar(false);
        return;
      }

      const res = await fetch("/api/transform-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputDataUrl: dataUrl,
          generationToken: permissionData.generationToken,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Avatar generation failed");
        setGeneratingAvatar(false);
        return;
      }

      setJobId(result.job_id);

      localStorage.setItem("active_avatar_job", result.job_id);

    } catch (err) {

      console.error(err);

      alert("Avatar generation error");

      setGeneratingAvatar(false);
    }

  };

  const handleSave = async () => {

    setSaving(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) {
      router.push("/login");
      return;
    }

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

      <h1 className="text-2xl font-bold">
        Edit Profile
      </h1>

      {remaining !== null && (
        <div className="text-sm">
          {remaining > 0 ? (
            <span className="text-gray-400">
              {remaining} generation{remaining !== 1 && "s"} remaining today
            </span>
          ) : (
            <span className="text-red-500">
              Daily limit reached (2 per day)
            </span>
          )}
        </div>
      )}

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
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setAvatarFile(file);
            if (file) {
              setAvatarPreview(URL.createObjectURL(file));
            }
          }}
        />

        {avatarFile && !generatingAvatar && (
          <button
            onClick={handleGenerateAvatar}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm"
          >
            Generate AI Avatar
          </button>
        )}

        {generatingAvatar && (
          <p className="text-xs text-purple-400">
            Generating AI avatar...
          </p>
        )}

        <p className="text-xs text-gray-500 text-center">
          Upload a clear portrait photo for best results.
        </p>

      </div>

      <div>

        <label className="text-sm text-gray-400">
          Username
        </label>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-lg p-3 mt-1"
        />

      </div>

      <div>

        <label className="text-sm text-gray-400">
          Display Name
        </label>

        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-lg p-3 mt-1"
        />

      </div>

      <div>

        <label className="text-sm text-gray-400">
          Bio
        </label>

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