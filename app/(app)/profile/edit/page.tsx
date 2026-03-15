"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

  const previewObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchRemaining();
  }, []);

  useEffect(() => {
    const restoreJob = async () => {
      const savedJob = localStorage.getItem("active_avatar_job");
      if (!savedJob) return;

      const { data: job } = await supabase
        .from("generation_jobs")
        .select("status, output_path")
        .eq("id", savedJob)
        .single();

      if (!job) {
        localStorage.removeItem("active_avatar_job");
        return;
      }

      if (job.status === "completed" && job.output_path) {
        const { data } = supabase.storage
          .from("persona-avatars")
          .getPublicUrl(job.output_path);

        setAvatarPreview(`${data.publicUrl}?v=${Date.now()}`);
        setGeneratingAvatar(false);
        setJobId(null);
        localStorage.removeItem("active_avatar_job");
        await fetchRemaining();
        return;
      }

      if (job.status === "failed") {
        localStorage.removeItem("active_avatar_job");
        setGeneratingAvatar(false);
        setJobId(null);
        return;
      }

      setJobId(savedJob);
      setGeneratingAvatar(true);
    };

    restoreJob();
  }, []);

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
            setJobId(null);
            await fetchRemaining();
          }

          if (job.status === "failed") {
            localStorage.removeItem("active_avatar_job");
            alert("Avatar generation failed.");
            setGeneratingAvatar(false);
            setJobId(null);
            await fetchRemaining();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

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

  const handleGenerateAvatar = async () => {
    if (!avatarFile || generatingAvatar) return;

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
        if (permissionRes.status === 429) {
          setRemaining(0);
        }

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
      await fetchRemaining();
    } catch (err) {
      console.error(err);
      alert("Avatar generation error");
      setGeneratingAvatar(false);
    }
  };

  const handleSave = async () => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    const cleanBio = bio.trim();

    if (!cleanUsername) {
      alert("Username is required.");
      return;
    }

    setSaving(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) {
      setSaving(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: cleanUsername,
        display_name: cleanDisplayName,
        bio: cleanBio,
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
      <div className="h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 max-w-xl mx-auto mt-8 space-y-8">
      <h1 className="text-2xl font-bold">Edit Profile</h1>

      {remaining !== null && (
        <div className="text-sm">
          {remaining > 0 ? (
            <span className="text-gray-400">
              {remaining} generation{remaining !== 1 && "s"} remaining today
            </span>
          ) : (
            <span className="text-red-500">Daily limit reached (2 per day)</span>
          )}
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-700 bg-[#0f0f0f]">
          {avatarPreview ? (
            <Image
              src={avatarPreview}
              alt="Avatar preview"
              width={112}
              height={112}
              className="w-full h-full object-cover"
              unoptimized
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

            if (previewObjectUrlRef.current) {
              URL.revokeObjectURL(previewObjectUrlRef.current);
              previewObjectUrlRef.current = null;
            }

            if (file) {
              const objectUrl = URL.createObjectURL(file);
              previewObjectUrlRef.current = objectUrl;
              setAvatarPreview(objectUrl);
            }
          }}
        />

        {avatarFile && !generatingAvatar && (
          <button
            onClick={handleGenerateAvatar}
            disabled={remaining === 0}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm disabled:opacity-50"
          >
            Generate AI Avatar
          </button>
        )}

        {generatingAvatar && (
          <p className="text-xs text-purple-400">Generating AI avatar...</p>
        )}

        <p className="text-xs text-gray-500 text-center">
          Upload a clear portrait photo for best results.
        </p>
      </div>

      <div>
        <label className="text-sm text-gray-400">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-lg p-3 mt-1"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <div>
        <label className="text-sm text-gray-400">Display Name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-black border border-gray-800 rounded-lg p-3 mt-1"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full bg-black border border-gray-800 rounded-lg p-3 mt-1"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving || generatingAvatar}
        className="w-full neon-button py-3 rounded-xl text-black font-semibold disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}