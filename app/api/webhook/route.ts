import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripe = getStripe();
  const supabase = getSupabaseAdmin();
  let event: Stripe.Event;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_email || session.customer_details?.email;
      const stripeCustomerId = session.customer as string;

      if (email) {
        await supabase
          .from("creators")
          .update({ plan: "pro", stripe_customer_id: stripeCustomerId })
          .eq("email", email);
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = sub.status;

      if (status === "active" || status === "trialing") {
        await supabase
          .from("creators")
          .update({ plan: "pro" })
          .eq("stripe_customer_id", customerId);
      } else if (status === "past_due" || status === "unpaid") {
        // Keep pro for now — Stripe retries payment
      } else if (status === "canceled" || status === "incomplete_expired") {
        await supabase
          .from("creators")
          .update({ plan: "free" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await supabase
        .from("creators")
        .update({ plan: "free" })
        .eq("stripe_customer_id", customerId);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      // Log failed payment — could trigger an email notification in the future
      console.log(`Payment failed for customer ${customerId}, invoice ${invoice.id}`);
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      // Ensure pro status on successful payment (covers reactivation)
      if (typeof customerId === "string") {
        await supabase
          .from("creators")
          .update({ plan: "pro" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
