import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { supabaseWithToken } from "@/lib/supabaseServer";
import { checkUsageLimit } from "@/lib/usageGuard";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

    // 🚀 ADMIN BYPASS (skips all business rules)
    if (isAdmin) {
      const generationToken = jwt.sign(
        { userId: user.id, mode: "admin" },
        process.env.GENERATION_TOKEN_SECRET!,
        { expiresIn: "60s" }
      );

      return NextResponse.json({
        generationToken,
        mode: "admin",
      });
    }

    // 🔐 Email verification check
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please verify your email." },
        { status: 403 }
      );
    }

    // 🔐 Account age restriction (5 minutes)
    const accountCreated = new Date(user.created_at).getTime();
    if (Date.now() - accountCreated < 5 * 60 * 1000) {
      return NextResponse.json(
        { error: "Please wait a few minutes before generating." },
        { status: 403 }
      );
    }

    // 🔐 Usage limit check (2/day)
    const usageCheck = await checkUsageLimit(token, user.id);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.reason },
        { status: 429 }
      );
    }

    // 🔥 Create short-lived generation token (60 seconds)
    const generationToken = jwt.sign(
      { userId: user.id, mode: "normal" },
      process.env.GENERATION_TOKEN_SECRET!,
      { expiresIn: "60s" }
    );

    return NextResponse.json({ generationToken });

  } catch (err: any) {
    console.error("GEN TOKEN ERROR:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}