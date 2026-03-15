import { NextResponse } from "next/server";
import { supabaseWithToken } from "@/lib/supabaseServer";

const DAILY_LIMIT = 2;

export async function GET(req: Request) {
  try {

    /* ---------------------------
       AUTHORIZATION HEADER
    --------------------------- */

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const supabase = supabaseWithToken(token);

    /* ---------------------------
       GET USER
    --------------------------- */

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* ---------------------------
       CHECK USER ROLE
    --------------------------- */

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("PROFILE FETCH ERROR:", profileError);
    }

    const isAdmin = profile?.role === "admin";

    /* ---------------------------
       ADMIN BYPASS
    --------------------------- */

    if (isAdmin) {

      return NextResponse.json({
        remaining: null,
        unlimited: true,
        mode: "admin",
      });

    }

    /* ---------------------------
       DAILY WINDOW
    --------------------------- */

    const now = new Date();

    const todayStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0
      )
    );

    /* ---------------------------
       COUNT USAGE
    --------------------------- */

    const { count, error: usageError } = await supabase
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString());

    if (usageError) {
      console.error("USAGE COUNT ERROR:", usageError);

      return NextResponse.json(
        { error: "Usage query failed" },
        { status: 500 }
      );
    }

    const remaining = Math.max(
      0,
      DAILY_LIMIT - (count ?? 0)
    );

    /* ---------------------------
       RESPONSE
    --------------------------- */

    return NextResponse.json({
      remaining,
      unlimited: false,
      limit: DAILY_LIMIT,
      used: count ?? 0,
      mode: "normal",
    });

  } catch (err: any) {

    console.error("USAGE ROUTE ERROR:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );

  }
}
