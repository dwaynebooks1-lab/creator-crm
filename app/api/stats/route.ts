import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

let cache: { data: Record<string, number>; at: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if (!rateLimit(`stats:${ip}`, 30, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const admin = getSupabaseAdmin();

    const [{ count: creators }, { count: fans }] = await Promise.all([
      admin.from("creators").select("*", { count: "exact", head: true }),
      admin.from("fans").select("*", { count: "exact", head: true }),
    ]);

    const data = {
      creators: creators || 0,
      fans: fans || 0,
    };

    cache = { data, at: Date.now() };
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ creators: 0, fans: 0 });
  }
}
