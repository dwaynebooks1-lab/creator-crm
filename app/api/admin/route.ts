import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET(req: NextRequest) {
  // Verify the caller is the admin
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await userClient.auth.getUser(token);
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();

  // Get all creators
  const { data: creators, error } = await admin
    .from("creators")
    .select("id, email, name, plan, stripe_customer_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get fan counts per creator
  const { data: fanCounts } = await admin
    .from("fans")
    .select("creator_id");

  const countMap: Record<string, number> = {};
  fanCounts?.forEach((f) => {
    countMap[f.creator_id] = (countMap[f.creator_id] || 0) + 1;
  });

  // Get total revenue per creator (sum of fan total_spent)
  const { data: revData } = await admin
    .from("fans")
    .select("creator_id, total_spent");

  const revMap: Record<string, number> = {};
  revData?.forEach((f) => {
    revMap[f.creator_id] = (revMap[f.creator_id] || 0) + (f.total_spent || 0);
  });

  const enriched = creators?.map((c) => ({
    ...c,
    fan_count: countMap[c.id] || 0,
    total_revenue: revMap[c.id] || 0,
  }));

  const stats = {
    total_users: creators?.length || 0,
    pro_users: creators?.filter((c) => c.plan === "pro").length || 0,
    free_users: creators?.filter((c) => c.plan === "free").length || 0,
    total_fans: fanCounts?.length || 0,
  };

  return NextResponse.json({ creators: enriched, stats });
}
