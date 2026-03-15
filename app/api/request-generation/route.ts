import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseWithToken } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const RATE_LIMIT_MS = 5000;

export async function POST(req: Request) {

  try {

    /* -----------------------------
       AUTHORIZATION
    ----------------------------- */

    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const supabase = supabaseWithToken(token);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /* -----------------------------
       FETCH PROFILE
    ----------------------------- */

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    /* -----------------------------
       ADMIN BYPASS
    ----------------------------- */

    if (isAdmin) {

      const generationToken = jwt.sign(
        {
          userId: user.id,
          mode: "admin"
        },
        process.env.GENERATION_TOKEN_SECRET!,
        {
          algorithm: "HS256",
          expiresIn: "60s"
        }
      );

      return NextResponse.json({
        generationToken,
        mode: "admin"
      });

    }

    /* -----------------------------
       EMAIL VERIFICATION
    ----------------------------- */

    if (!user.email_confirmed_at) {

      return NextResponse.json(
        { error: "Please verify your email." },
        { status: 403 }
      );

    }

    /* -----------------------------
       ACCOUNT AGE CHECK
    ----------------------------- */

    const accountCreated = new Date(user.created_at).getTime();

    if (Date.now() - accountCreated < 5 * 60 * 1000) {

      return NextResponse.json(
        { error: "Please wait a few minutes before generating." },
        { status: 403 }
      );

    }

    /* -----------------------------
       ACTIVE GENERATION PROTECTION
    ----------------------------- */

    const { data: activeJob } = await supabase
      .from("generation_jobs")
      .select("id, status")
      .eq("user_id", user.id)
      .in("status", ["pending", "processing"])
      .limit(1)
      .maybeSingle();

    if (activeJob) {

      return NextResponse.json(
        {
          error:
            "You already have a generation in progress. Please wait until it finishes."
        },
        { status: 429 }
      );

    }

    /* -----------------------------
       RATE LIMIT (5s)
    ----------------------------- */

    const { data: lastRequest } = await supabase
      .from("usage_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastRequest?.created_at) {

      const lastTime = new Date(lastRequest.created_at).getTime();

      if (Date.now() - lastTime < RATE_LIMIT_MS) {

        return NextResponse.json(
          { error: "Please wait a few seconds before generating again." },
          { status: 429 }
        );

      }

    }

    /* -----------------------------
       DAILY LIMIT (Atomic RPC)
    ----------------------------- */

    const { data: allowed } =
      await supabase.rpc("try_log_generation", {
        p_user_id: user.id
      });

    if (!allowed) {

      return NextResponse.json(
        { error: "Daily generation limit reached (2 per day)." },
        { status: 429 }
      );

    }

    /* -----------------------------
       GENERATION TOKEN
    ----------------------------- */

    const generationToken = jwt.sign(
      {
        userId: user.id,
        mode: "normal"
      },
      process.env.GENERATION_TOKEN_SECRET!,
      {
        algorithm: "HS256",
        expiresIn: "60s"
      }
    );

    return NextResponse.json({
      generationToken,
      mode: "normal"
    });

  } catch (err: any) {

    console.error("GEN TOKEN ERROR:", err);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );

  }

}