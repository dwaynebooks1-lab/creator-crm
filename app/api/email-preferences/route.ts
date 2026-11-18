import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const { data: { user } } = await anonClient.auth.getUser(auth.split(" ")[1]);
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("creators")
    .select("email_digest")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ email_digest: data?.email_digest ?? true });
}

export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email_digest } = await req.json();
  if (typeof email_digest !== "boolean") {
    return NextResponse.json({ error: "email_digest must be boolean" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("creators")
    .update({ email_digest })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email_digest });
}
