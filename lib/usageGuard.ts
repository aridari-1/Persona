import { supabaseWithToken } from "@/lib/supabaseServer";

const DAILY_LIMIT = 2; // 🔥 TOTAL PER DAY (ALL TYPES)

export async function checkUsageLimit(
  token: string,
  userId: string
) {
  const supabase = supabaseWithToken(token);

  // 🔥 Midnight UTC reset
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
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());

  if ((count ?? 0) >= DAILY_LIMIT) {
    return {
      allowed: false,
      reason: `Daily generation limit reached (${DAILY_LIMIT} per day).`,
    };
  }

  return { allowed: true };
}

export async function logUsage(
  token: string,
  userId: string,
  actionType: "avatar" | "post" | "story"
) {
  const supabase = supabaseWithToken(token);

  await supabase.from("usage_logs").insert({
    user_id: userId,
    action_type: actionType,
  });
}