import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendNudgeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
  const fourDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString();

  const { data: creators } = await admin
    .from("creators")
    .select("id, email, name, created_at")
    .gte("created_at", fourDaysAgo)
    .lte("created_at", twoDaysAgo);

  if (!creators || creators.length === 0) {
    return NextResponse.json({ nudged: 0 });
  }

  let nudged = 0;

  for (const creator of creators) {
    const { count } = await admin
      .from("fans")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", creator.id);

    // Only nudge if they have 0 real fans (demo fans have "(demo)" in name)
    // or only have demo fans
    if (count && count > 0) {
      const { data: realFans } = await admin
        .from("fans")
        .select("name")
        .eq("creator_id", creator.id)
        .not("name", "ilike", "%(demo)%")
        .limit(1);

      if (realFans && realFans.length > 0) continue;
    }

    if (!creator.email) continue;

    try {
      await sendNudgeEmail(creator.email, creator.name);
      nudged++;
    } catch (err) {
      console.error(`Failed to nudge ${creator.email}:`, err);
    }
  }

  return NextResponse.json({
    checked: creators.length,
    nudged,
  });
}
