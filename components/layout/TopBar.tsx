"use client";

import { useRouter } from "next/navigation";
import { Bell, Send, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

type JobType = "post" | "story" | "avatar" | "banner" | null;

export default function TopBar() {
  const router = useRouter();

  const [generating, setGenerating] = useState(false);
  const [jobType, setJobType] = useState<JobType>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const routeForJob = (type: JobType) => {
    if (!type) return "/feed";

    switch (type) {
      case "post":
        return "/create/post";
      case "story":
        return "/create/story";
      case "avatar":
      case "banner":
        return "/profile/edit";
      default:
        return "/feed";
    }
  };

  const checkActiveJob = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    const { data } = await supabase
      .from("generation_jobs")
      .select("job_type,status")
      .eq("user_id", user.id)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setGenerating(true);
      setJobType(data[0].job_type as JobType);
    } else {
      setGenerating(false);
      setJobType(null);
    }
  };

  useEffect(() => {
    checkActiveJob();

    const channel = supabase
      .channel("generation-topbar")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "generation_jobs",
        },
        () => {
          checkActiveJob();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="h-14 px-4 flex items-center justify-between bg-[#0f0f0f]">

      {/* APP NAME */}
      <div
        onClick={() => router.push("/feed")}
        className="text-[15px] font-semibold tracking-wide cursor-pointer"
      >
        Persona
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-5">

        {generating && (
          <button
            onClick={() => router.push(routeForJob(jobType))}
            className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300"
          >
            <div className="h-3 w-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="hidden sm:inline">
              AI Generating...
            </span>
          </button>
        )}

        <button
          onClick={() => router.push("/notifications")}
          className="text-gray-400 hover:text-white transition"
        >
          <Bell size={20} strokeWidth={1.5} />
        </button>

        <button
          onClick={() => router.push("/messages")}
          className="text-gray-400 hover:text-white transition"
        >
          <Send size={20} strokeWidth={1.5} />
        </button>

        <button
          onClick={handleLogout}
          className="text-gray-400 hover:text-red-500 transition"
        >
          <LogOut size={20} strokeWidth={1.5} />
        </button>

      </div>

    </div>
  );
}