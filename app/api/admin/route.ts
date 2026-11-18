import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await userClient.auth.getUser(token);
  if (!user || !ADMIN_EMAIL || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }
  return user;
}

export async function GET(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) {
    return NextResponse.json(
      { error: "Forbidden", hint: !ADMIN_EMAIL ? "ADMIN_EMAIL env var not set" : "Email mismatch" },
      { status: 403 }
    );
  }

  const admin = getSupabaseAdmin();

  const { data: creators, error } = await admin
    .from("creators")
    .select("id, email, name, plan, stripe_customer_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: fanCounts } = await admin.from("fans").select("creator_id");
  const countMap: Record<string, number> = {};
  fanCounts?.forEach((f) => { countMap[f.creator_id] = (countMap[f.creator_id] || 0) + 1; });

  const { data: revData } = await admin.from("fans").select("creator_id, total_spent");
  const revMap: Record<string, number> = {};
  revData?.forEach((f) => { revMap[f.creator_id] = (revMap[f.creator_id] || 0) + (f.total_spent || 0); });

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

  // Get announcements
  const { data: announcements } = await admin
    .from("announcements")
    .select("id, message, active, created_at")
    .order("created_at", { ascending: false });

  // Get support tickets
  const { data: tickets } = await admin
    .from("support_tickets")
    .select("id, name, email, subject, message, status, created_at")
    .order("created_at", { ascending: false });

  // Get reviews
  const { data: reviews } = await admin
    .from("reviews")
    .select("id, rating, message, name, role, approved, created_at")
    .order("created_at", { ascending: false });

  // Get leads
  const { data: leads } = await admin
    .from("leads")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ creators: enriched, stats, announcements: announcements || [], tickets: tickets || [], reviews: reviews || [], leads: leads || [] });
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req);
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const admin = getSupabaseAdmin();

  // Delete user
  if (body.action === "delete_user") {
    const { userId } = body;
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }
    // Delete from creators table (fans cascade)
    await admin.from("creators").delete().eq("id", userId);
    // Delete from Supabase Auth
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ success: true });
  }

  // Change plan
  if (body.action === "change_plan") {
    const { userId, plan } = body;
    if (!["free", "pro"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    await admin.from("creators").update({ plan }).eq("id", userId);
    return NextResponse.json({ success: true });
  }

  // Get fans for a user
  if (body.action === "get_fans") {
    const { userId } = body;
    const { data: fans } = await admin
      .from("fans")
      .select("id, name, tag, total_spent, last_message_at, renewal_date, notes")
      .eq("creator_id", userId)
      .order("total_spent", { ascending: false });
    return NextResponse.json({ fans: fans || [] });
  }

  // Save announcement
  if (body.action === "save_announcement") {
    const { message } = body;
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }
    const { error } = await admin.from("announcements").insert({ message: message.trim(), active: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Delete announcement
  if (body.action === "delete_announcement") {
    const { announcementId } = body;
    await admin.from("announcements").delete().eq("id", announcementId);
    return NextResponse.json({ success: true });
  }

  // Toggle announcement active
  if (body.action === "toggle_announcement") {
    const { announcementId, active } = body;
    await admin.from("announcements").update({ active }).eq("id", announcementId);
    return NextResponse.json({ success: true });
  }

  // Resolve ticket
  if (body.action === "resolve_ticket") {
    const { ticketId } = body;
    await admin.from("support_tickets").update({ status: "resolved" }).eq("id", ticketId);
    return NextResponse.json({ success: true });
  }

  // Delete ticket
  if (body.action === "delete_ticket") {
    const { ticketId } = body;
    await admin.from("support_tickets").delete().eq("id", ticketId);
    return NextResponse.json({ success: true });
  }

  // Approve/hide review
  if (body.action === "toggle_review") {
    const { reviewId, approved } = body;
    await admin.from("reviews").update({ approved }).eq("id", reviewId);
    return NextResponse.json({ success: true });
  }

  // Delete review
  if (body.action === "delete_review") {
    const { reviewId } = body;
    await admin.from("reviews").delete().eq("id", reviewId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
