import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendSignupNotification } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!rateLimit(`welcome:${ip}`, 3, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { email, name, ref, utm_source, utm_medium, utm_campaign } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    await sendWelcomeEmail(email, name);
    sendSignupNotification(email, name, { utm_source, utm_medium, utm_campaign }).catch(() => {});

    if (ref && typeof ref === "string" && ref.length >= 6) {
      const admin = getSupabaseAdmin();
      const { data: referrers } = await admin
        .from("creators")
        .select("id")
        .ilike("id", `${ref}%`)
        .limit(1);
      if (referrers && referrers.length > 0) {
        await admin.from("referrals").upsert(
          { referrer_id: referrers[0].id, referred_email: email.toLowerCase().trim(), status: "signed_up" },
          { onConflict: "referred_email" }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
