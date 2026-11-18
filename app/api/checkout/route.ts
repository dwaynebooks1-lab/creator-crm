import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const monthlyPriceId = process.env.STRIPE_PRICE_ID;
  const annualPriceId = process.env.STRIPE_PRICE_ID_ANNUAL;

  if (!monthlyPriceId) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let body: { plan?: string } = {};
  try {
    body = await req.json();
  } catch {
    // No body or invalid JSON — default to monthly
  }

  const plan = body.plan === "annual" ? "annual" : "monthly";
  const priceId = plan === "annual" && annualPriceId ? annualPriceId : monthlyPriceId;

  // Get the user's email from the auth token
  const authHeader = req.headers.get("authorization");
  let customerEmail: string | undefined;

  if (req.cookies.get("sb-apxhyfyykjeukczbgvga-auth-token")) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
    );
    const { data } = await supabase.auth.getUser();
    customerEmail = data.user?.email;
  }

  const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?upgraded=true`,
      cancel_url: `${origin}/dashboard`,
      ...(customerEmail && { customer_email: customerEmail }),
    });
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
