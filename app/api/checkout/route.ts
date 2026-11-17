import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  // Get the user's email from the auth token
  const authHeader = req.headers.get("authorization");
  let customerEmail: string | undefined;

  if (req.cookies.get("sb-apxhyfyykjeukczbgvga-auth-token")) {
    // Try to get user from Supabase auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
    );
    const { data } = await supabase.auth.getUser();
    customerEmail = data.user?.email;
  }

  const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=true`,
    cancel_url: `${origin}/dashboard`,
    ...(customerEmail && { customer_email: customerEmail }),
  });

  return NextResponse.json({ url: session.url });
}
