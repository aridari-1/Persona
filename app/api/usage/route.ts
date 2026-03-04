import { NextResponse } from "next/server";
import { supabaseWithToken } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("Authorization") || "";

    if (!auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");
    const supabase = supabaseWithToken(token);

    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 Fetch user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // 🚀 Admin unlimited bypass
    if (isAdmin) {
      return NextResponse.json({
        remaining: 999,
        mode: "admin",
      });
    }

    // 🔢 Normal daily calculation
    const now = new Date();
    const todayStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      )
    );

    const { count } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString());

    const DAILY_LIMIT = 2;
    const remaining = Math.max(0, DAILY_LIMIT - (count ?? 0));

    return NextResponse.json({
      remaining,
      mode: "normal",
    });

  } catch (err: any) {
    console.error("USAGE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}