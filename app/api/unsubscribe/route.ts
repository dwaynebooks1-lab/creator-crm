import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse(htmlPage("Invalid Link", "This unsubscribe link is missing or malformed."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return new NextResponse(htmlPage("Invalid Link", "This unsubscribe link is invalid or expired."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("creators")
    .update({ email_digest: false })
    .eq("id", userId);

  if (error) {
    return new NextResponse(
      htmlPage("Unsubscribed", "You've been unsubscribed from weekly digest emails. You can re-enable them anytime in Settings."),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  return new NextResponse(
    htmlPage("Unsubscribed", "You've been unsubscribed from weekly digest emails. You can re-enable them anytime in Settings."),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — CreatorCRM</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #fff; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
  .card { max-width: 440px; text-align: center; }
  h1 { font-size: 24px; margin-bottom: 12px; }
  p { color: #9ca3af; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
  a { display: inline-block; background: #ec4899; color: #fff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
  a:hover { background: #db2777; }
</style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://creatorcrm.net/settings">Go to Settings</a>
  </div>
</body>
</html>`;
}
