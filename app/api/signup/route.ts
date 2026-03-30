import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {

    const { email, password, captchaToken } = await req.json();

    if (!email || !password || !captchaToken) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    /* -----------------------------
       EMAIL VALIDATION
    ----------------------------- */

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    /* ✅ GMAIL and edu ONLY CHECK */
    const lowerEmail = email.toLowerCase();

if (
  !lowerEmail.endsWith("@gmail.com") &&
  !lowerEmail.endsWith(".edu")
) {
  return NextResponse.json(
    { error: "Please use a Gmail or school email to register." },
    { status: 400 }
  );
}

    /* -----------------------------
       PASSWORD RULE
    ----------------------------- */

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    /* -----------------------------
       USER IP (Turnstile)
    ----------------------------- */

    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "";

    /* -----------------------------
       VERIFY TURNSTILE CAPTCHA
    ----------------------------- */

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${captchaToken}&remoteip=${ip}`,
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 403 }
      );
    }

    /* -----------------------------
       CREATE SUPABASE CLIENT
    ----------------------------- */

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    /* -----------------------------
       SIGN UP USER
    ----------------------------- */

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    /* -----------------------------
       SUCCESS
    ----------------------------- */

    return NextResponse.json({
      success: true,
      message: "Account created. Please check your email to verify.",
    });

  } catch (err) {

    console.error("SIGNUP ERROR:", err);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );

  }
}