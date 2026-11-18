import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authErr } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ).auth.getUser(token);

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: fans } = await supabase
    .from("fans")
    .select("*")
    .eq("creator_id", user.id);

  if (!fans || fans.length === 0) {
    return NextResponse.json({
      total_fans: 0,
      total_revenue: 0,
      avg_spend: 0,
      at_risk_count: 0,
      renewals_this_week: 0,
      unmessaged_7d: 0,
      top_fans: [],
      tag_breakdown: {},
    });
  }

  const now = Date.now();
  const weekMs = 7 * 86400000;

  const totalRevenue = fans.reduce((s, f) => s + (f.total_spent || 0), 0);
  const atRisk = fans.filter(f => f.tag === "at-risk").length;
  const renewalsSoon = fans.filter(f => {
    if (!f.renewal_date) return false;
    const diff = new Date(f.renewal_date).getTime() - now;
    return diff >= 0 && diff <= weekMs;
  }).length;
  const unmessaged = fans.filter(f => {
    if (!f.last_message_at) return true;
    return now - new Date(f.last_message_at).getTime() > weekMs;
  }).length;

  const tagBreakdown: Record<string, number> = {};
  fans.forEach(f => { tagBreakdown[f.tag] = (tagBreakdown[f.tag] || 0) + 1; });

  const topFans = [...fans]
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 5)
    .map(f => ({ name: f.name, total_spent: f.total_spent, tag: f.tag }));

  return NextResponse.json({
    total_fans: fans.length,
    total_revenue: totalRevenue,
    avg_spend: Math.round(totalRevenue / fans.length),
    at_risk_count: atRisk,
    renewals_this_week: renewalsSoon,
    unmessaged_7d: unmessaged,
    top_fans: topFans,
    tag_breakdown: tagBreakdown,
  });
}
