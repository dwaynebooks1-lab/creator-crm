import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authErr } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ).auth.getUser(auth.split(" ")[1]);

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { rating, message, name, role } = body;

  if (!rating || !message?.trim() || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating (1-5) and message are required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("creator_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from("reviews")
      .update({ rating, message: message.trim(), name: name?.trim() || null, role: role?.trim() || null })
      .eq("creator_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, updated: true });
  }

  const { error } = await supabase.from("reviews").insert({
    creator_id: user.id,
    rating,
    message: message.trim(),
    name: name?.trim() || null,
    role: role?.trim() || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating, message, name, role, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data });
}
