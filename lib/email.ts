import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = "CreatorCRM <hello@creatorcrm.net>";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function sendWelcomeEmail(to: string, name?: string) {
  const firstName = esc(name?.split(" ")[0] || "there");

  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Welcome to CreatorCRM!",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">Welcome to CreatorCRM!</h1>
        <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
          Hey ${firstName}, thanks for signing up. You're all set to start managing your fans like a pro.
        </p>
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">Get started in 3 steps:</h3>
          <p style="font-size: 14px; color: #374151; margin: 8px 0;">1. Add your first fan (or import a CSV)</p>
          <p style="font-size: 14px; color: #374151; margin: 8px 0;">2. Tag them (Whale, VIP, Regular, New, At-Risk)</p>
          <p style="font-size: 14px; color: #374151; margin: 8px 0;">3. Use the Action Center to know who to message</p>
        </div>
        <a href="https://creatorcrm.net/dashboard" style="display: inline-block; background: #ec4899; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          Go to Dashboard
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          Questions? Reply to this email or visit <a href="https://creatorcrm.net/help" style="color: #ec4899;">our FAQ</a>.
        </p>
      </div>
    `,
  });
}

export async function sendSignupNotification(
  email: string,
  name?: string,
  utm?: { utm_source?: string; utm_medium?: string; utm_campaign?: string }
) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const source = [utm?.utm_source, utm?.utm_medium, utm?.utm_campaign].filter(Boolean).join(" / ");

  return getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[New Signup] ${esc(name || email)} just joined CreatorCRM`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">New User Signed Up</h1>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #166534; margin: 0 0 6px;"><strong>Name:</strong> ${esc(name || "Not provided")}</p>
          <p style="font-size: 14px; color: #166534; margin: 0 0 6px;"><strong>Email:</strong> ${esc(email)}</p>
          ${source ? `<p style="font-size: 14px; color: #166534; margin: 0;"><strong>Source:</strong> ${esc(source)}</p>` : ""}
        </div>
        <a href="https://creatorcrm.net/admin" style="display: inline-block; background: #ec4899; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
          View in Admin
        </a>
        <p style="color: #9ca3af; font-size: 11px; margin-top: 24px;">CreatorCRM admin notification</p>
      </div>
    `,
  });
}

export async function sendLeadNotification(email: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  return getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[New Lead] ${esc(email)} wants updates`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">New Lead Captured</h1>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #1e40af; margin: 0;"><strong>Email:</strong> ${esc(email)}</p>
        </div>
        <p style="font-size: 13px; color: #6b7280;">They dropped their email on the landing page — interested but not ready to sign up yet.</p>
        <a href="https://creatorcrm.net/admin" style="display: inline-block; background: #ec4899; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 16px;">
          View Leads
        </a>
      </div>
    `,
  });
}

export async function sendContactNotification(
  ticket: { name: string; email: string; subject: string; message: string }
) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  return getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `[Support] ${esc(ticket.subject)} — from ${esc(ticket.name)}`,
    replyTo: ticket.email,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">New Support Ticket</h1>
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px;"><strong style="color: #111;">From:</strong> ${esc(ticket.name)} (${esc(ticket.email)})</p>
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px;"><strong style="color: #111;">Subject:</strong> ${esc(ticket.subject)}</p>
        </div>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
          <p style="font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap; margin: 0;">${esc(ticket.message)}</p>
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin-top: 24px;">Reply directly to this email to respond to ${esc(ticket.name)}.</p>
      </div>
    `,
  });
}

export async function sendDigestEmail(
  to: string,
  name: string | null,
  stats: {
    totalFans: number;
    totalRevenue: number;
    newFansThisWeek: number;
    messagedThisWeek: number;
    engagement: number;
    atRiskFans: number;
    urgentRenewals: number;
  },
  highlights: string[]
) {
  const firstName = esc(name?.split(" ")[0] || "there");

  const statRows = [
    { label: "Total Fans", value: String(stats.totalFans) },
    { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}` },
    { label: "New This Week", value: String(stats.newFansThisWeek) },
    { label: "Messaged This Week", value: String(stats.messagedThisWeek) },
    { label: "Engagement Rate", value: `${stats.engagement}%` },
    { label: "At-Risk Fans", value: String(stats.atRiskFans) },
    { label: "Renewals This Week", value: String(stats.urgentRenewals) },
  ];

  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Your weekly fan report — ${stats.newFansThisWeek} new fan${stats.newFansThisWeek !== 1 ? "s" : ""}, ${stats.engagement}% engagement`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 4px;">Weekly Fan Report</h1>
        <p style="color: #6b7280; font-size: 13px; margin-bottom: 24px;">Hey ${firstName}, here's how your fans are doing this week.</p>

        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            ${statRows.map(r => `
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">${r.label}</td>
                <td style="padding: 6px 0; font-size: 14px; font-weight: 600; text-align: right;">${r.value}</td>
              </tr>
            `).join("")}
          </table>
        </div>

        ${highlights.length > 0 ? `
          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Highlights</h3>
            ${highlights.map(h => `<p style="font-size: 13px; color: #374151; margin: 4px 0;">• ${h}</p>`).join("")}
          </div>
        ` : ""}

        <a href="https://creatorcrm.net/dashboard" style="display: inline-block; background: #ec4899; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          Open Dashboard
        </a>

        <p style="color: #9ca3af; font-size: 11px; margin-top: 32px;">
          You're receiving this because you have a CreatorCRM account. <a href="https://creatorcrm.net/settings" style="color: #ec4899;">Manage preferences</a>
        </p>
      </div>
    `,
  });
}
