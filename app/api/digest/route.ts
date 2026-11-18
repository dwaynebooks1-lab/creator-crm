import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDigestEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || ""}` && !process.env.CRON_SECRET) {
    // Allow without auth in dev, but log warning
  }

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();

  const { data: creators } = await admin
    .from("creators")
    .select("id, email, name, plan");

  if (!creators) return NextResponse.json({ error: "No creators found" }, { status: 500 });

  const digests = [];

  for (const creator of creators) {
    const { data: fans } = await admin
      .from("fans")
      .select("*")
      .eq("creator_id", creator.id);

    if (!fans || fans.length === 0) continue;

    const totalFans = fans.length;
    const totalRevenue = fans.reduce((s: number, f: { total_spent?: number }) => s + (f.total_spent || 0), 0);

    const newFansThisWeek = fans.filter((f: { created_at?: string }) => {
      return f.created_at && new Date(f.created_at).toISOString() >= weekAgo;
    }).length;

    const newFansLastWeek = fans.filter((f: { created_at?: string }) => {
      if (!f.created_at) return false;
      const t = new Date(f.created_at).toISOString();
      return t >= twoWeeksAgo && t < weekAgo;
    }).length;

    const messagedThisWeek = fans.filter((f: { last_message_at?: string | null }) => {
      return f.last_message_at && new Date(f.last_message_at).toISOString() >= weekAgo;
    }).length;

    const atRiskFans = fans.filter((f: { tag?: string }) => f.tag === "at-risk").length;

    const urgentRenewals = fans.filter((f: { renewal_date?: string | null }) => {
      if (!f.renewal_date) return false;
      const daysUntil = Math.floor((new Date(f.renewal_date).getTime() - Date.now()) / 86400000);
      return daysUntil >= 0 && daysUntil <= 7;
    }).length;

    const unmessaged = fans.filter((f: { last_message_at?: string | null }) => !f.last_message_at).length;
    const engagement = totalFans > 0 ? Math.round((messagedThisWeek / totalFans) * 100) : 0;

    const topFan = [...fans].sort((a: { total_spent?: number }, b: { total_spent?: number }) => (b.total_spent || 0) - (a.total_spent || 0))[0];

    digests.push({
      creator_id: creator.id,
      email: creator.email,
      name: creator.name,
      plan: creator.plan,
      stats: {
        totalFans,
        totalRevenue,
        newFansThisWeek,
        newFansLastWeek,
        fanGrowth: newFansLastWeek > 0 ? Math.round(((newFansThisWeek - newFansLastWeek) / newFansLastWeek) * 100) : newFansThisWeek > 0 ? 100 : 0,
        messagedThisWeek,
        engagement,
        atRiskFans,
        urgentRenewals,
        unmessaged,
        topFan: topFan ? { name: topFan.name, spent: topFan.total_spent } : null,
      },
      highlights: generateHighlights({
        newFansThisWeek, newFansLastWeek, messagedThisWeek,
        engagement, atRiskFans, urgentRenewals, unmessaged, totalFans,
      }),
    });
  }

  // Send digest emails
  const sent: string[] = [];
  for (const d of digests) {
    if (!d.email) continue;
    try {
      await sendDigestEmail(d.email, d.name, d.stats, d.highlights);
      sent.push(d.email);
    } catch (err) {
      console.error(`Failed to send digest to ${d.email}:`, err);
    }
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    period: { from: weekAgo, to: new Date().toISOString() },
    creator_count: digests.length,
    emails_sent: sent.length,
    digests,
  });
}

function generateHighlights(s: {
  newFansThisWeek: number; newFansLastWeek: number; messagedThisWeek: number;
  engagement: number; atRiskFans: number; urgentRenewals: number; unmessaged: number; totalFans: number;
}): string[] {
  const h: string[] = [];

  if (s.newFansThisWeek > 0) {
    if (s.newFansThisWeek > s.newFansLastWeek) {
      h.push(`You gained ${s.newFansThisWeek} new fan${s.newFansThisWeek !== 1 ? "s" : ""} this week — up from ${s.newFansLastWeek} last week!`);
    } else {
      h.push(`You gained ${s.newFansThisWeek} new fan${s.newFansThisWeek !== 1 ? "s" : ""} this week.`);
    }
  }

  if (s.engagement >= 75) {
    h.push(`Your engagement is ${s.engagement}% — excellent work!`);
  } else if (s.engagement < 25 && s.totalFans > 0) {
    h.push(`Your engagement is only ${s.engagement}%. Try messaging a few fans today!`);
  }

  if (s.atRiskFans > 0) {
    h.push(`${s.atRiskFans} fan${s.atRiskFans !== 1 ? "s are" : " is"} at risk of leaving.`);
  }

  if (s.urgentRenewals > 0) {
    h.push(`${s.urgentRenewals} fan${s.urgentRenewals !== 1 ? "s" : ""} renew${s.urgentRenewals === 1 ? "s" : ""} this week — reach out now!`);
  }

  if (s.unmessaged > 0 && s.unmessaged <= 5) {
    h.push(`${s.unmessaged} fan${s.unmessaged !== 1 ? "s have" : " has"} never been messaged.`);
  }

  if (h.length === 0) h.push("All looking good this week. Keep up the momentum!");

  return h;
}
