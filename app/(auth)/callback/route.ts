import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as any,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=verification_failed", req.url));
  }

  return NextResponse.redirect(new URL("/onboarding", req.url));
}