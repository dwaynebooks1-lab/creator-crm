import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: creator }, { data: fans }] = await Promise.all([
    adminClient.from("creators").select("*").eq("id", user.id).single(),
    adminClient.from("fans").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      email: user.email,
      plan: creator?.plan || "free",
      created_at: creator?.created_at,
    },
    fans: (fans || []).map(f => ({
      name: f.name,
      tag: f.tag,
      platform: f.platform || "",
      total_spent: f.total_spent,
      renewal_date: f.renewal_date,
      last_message_at: f.last_message_at,
      notes: f.notes,
      created_at: f.created_at,
    })),
    total_fans: fans?.length || 0,
    total_revenue: (fans || []).reduce((s, f) => s + (f.total_spent || 0), 0),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="creatorcrm-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
