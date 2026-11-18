"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");

  // Profile
  const [name, setName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState({ type: "", text: "" });

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  // MFA
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaSaving, setMfaSaving] = useState(false);
  const [mfaMsg, setMfaMsg] = useState({ type: "", text: "" });
  const [mfaDisabling, setMfaDisabling] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setName(u.user_metadata?.name || "");

      const { data: creator } = await supabase
        .from("creators").select("plan").eq("id", u.id).single();
      if (creator) setPlan(creator.plan);

      // Check MFA status
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find((f) => f.status === "verified");
      if (verified) {
        setMfaEnabled(true);
        setMfaFactorId(verified.id);
      }

      setLoading(false);
    });
  }, [router]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg({ type: "", text: "" });

    const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
    if (error) {
      setProfileMsg({ type: "error", text: error.message });
      setProfileSaving(false);
      return;
    }

    await supabase.from("creators").update({ name: name.trim() }).eq("id", user!.id);
    setProfileSaving(false);
    setProfileMsg({ type: "success", text: "Profile updated!" });
    setTimeout(() => setProfileMsg({ type: "", text: "" }), 3000);
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMsg({ type: "", text: "" });

    if (!emailPassword) {
      setEmailMsg({ type: "error", text: "Enter your current password to confirm" });
      setEmailSaving(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: emailPassword,
    });

    if (signInError) {
      setEmailMsg({ type: "error", text: "Incorrect password" });
      setEmailSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      setEmailMsg({ type: "error", text: error.message });
      setEmailSaving(false);
      return;
    }

    setEmailSaving(false);
    setEmailMsg({ type: "success", text: "Verification email sent to your new address. Check both your old and new email to confirm the change." });
    setNewEmail("");
    setEmailPassword("");
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg({ type: "", text: "" });

    if (newPassword.length < 6) {
      setPwMsg({ type: "error", text: "New password must be at least 6 characters" });
      setPwSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords don't match" });
      setPwSaving(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });

    if (signInError) {
      setPwMsg({ type: "error", text: "Current password is incorrect" });
      setPwSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMsg({ type: "error", text: error.message });
      setPwSaving(false);
      return;
    }

    setPwSaving(false);
    setPwMsg({ type: "success", text: "Password updated successfully!" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwMsg({ type: "", text: "" }), 3000);
  }

  async function handleMfaEnroll() {
    setMfaMsg({ type: "", text: "" });
    setMfaEnrolling(true);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "CreatorCRM",
    });

    if (error) {
      setMfaMsg({ type: "error", text: error.message });
      setMfaEnrolling(false);
      return;
    }

    setQrCode(data.totp.qr_code);
    setMfaSecret(data.totp.secret);
    setMfaFactorId(data.id);
  }

  async function handleMfaVerify(e: React.FormEvent) {
    e.preventDefault();
    setMfaSaving(true);
    setMfaMsg({ type: "", text: "" });

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: mfaFactorId,
    });

    if (challengeError) {
      setMfaMsg({ type: "error", text: challengeError.message });
      setMfaSaving(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: mfaCode.trim(),
    });

    if (verifyError) {
      setMfaMsg({ type: "error", text: "Invalid code. Make sure the code from your app matches." });
      setMfaSaving(false);
      return;
    }

    setMfaEnabled(true);
    setMfaEnrolling(false);
    setMfaCode("");
    setQrCode("");
    setMfaSecret("");
    setMfaSaving(false);
    setMfaMsg({ type: "success", text: "Two-factor authentication is now enabled!" });
    setTimeout(() => setMfaMsg({ type: "", text: "" }), 5000);
  }

  async function handleMfaDisable() {
    setMfaDisabling(true);
    setMfaMsg({ type: "", text: "" });

    const { error } = await supabase.auth.mfa.unenroll({
      factorId: mfaFactorId,
    });

    if (error) {
      setMfaMsg({ type: "error", text: error.message });
      setMfaDisabling(false);
      return;
    }

    setMfaEnabled(false);
    setMfaFactorId("");
    setMfaDisabling(false);
    setMfaMsg({ type: "success", text: "Two-factor authentication has been disabled." });
    setTimeout(() => setMfaMsg({ type: "", text: "" }), 3000);
  }

  async function handleUpgrade(plan: "monthly" | "annual" = "monthly") {
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  function Msg({ msg }: { msg: { type: string; text: string } }) {
    if (!msg.text) return null;
    const isError = msg.type === "error";
    return (
      <div className={`mb-4 rounded-lg border p-3 text-sm ${isError ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-green-500/30 bg-green-500/10 text-green-300"}`}>
        {msg.text}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold">
            Creator<span className="text-brand-500">CRM</span>
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {/* Profile */}
        <form onSubmit={handleProfileSave} className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          <Msg msg={profileMsg} />
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Current Email</label>
              <p className="px-3 py-2.5 text-sm text-[var(--muted)]">{user?.email}</p>
            </div>
            <button type="submit" disabled={profileSaving}
              className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
              {profileSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>

        {/* Change Email */}
        <form onSubmit={handleEmailChange} className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-1">Change Email</h2>
          <p className="text-xs text-[var(--muted)] mb-4">A verification link will be sent to your new email address. You must confirm it before the change takes effect.</p>
          <Msg msg={emailMsg} />
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">New Email</label>
              <input
                type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="newemail@example.com" required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Current Password (to confirm it&apos;s you)</label>
              <input
                type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="Enter your current password" required
              />
            </div>
            <button type="submit" disabled={emailSaving || !newEmail.trim()}
              className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
              {emailSaving ? "Sending..." : "Send Verification Email"}
            </button>
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <Msg msg={pwMsg} />
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Current Password</label>
              <input
                type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="Your current password" required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">New Password</label>
              <input
                type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="At least 6 characters" minLength={6} required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Confirm New Password</label>
              <input
                type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 transition"
                placeholder="Type new password again" minLength={6} required
              />
            </div>
            <button type="submit" disabled={pwSaving}
              className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
              {pwSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>

        {/* Two-Factor Authentication */}
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
            {mfaEnabled && (
              <span className="rounded-full bg-green-500/20 border border-green-500/30 px-2.5 py-0.5 text-xs font-medium text-green-400">Enabled</span>
            )}
          </div>
          <p className="text-xs text-[var(--muted)] mb-4">
            Add an extra layer of security. When enabled, you&apos;ll need a 6-digit code from your authenticator app (Google Authenticator, Authy, etc.) every time you log in.
          </p>
          <Msg msg={mfaMsg} />

          {!mfaEnabled && !mfaEnrolling && (
            <button onClick={handleMfaEnroll}
              className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
              Enable Two-Factor Auth
            </button>
          )}

          {mfaEnrolling && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                <p className="text-sm font-medium mb-3">1. Scan this QR code with your authenticator app:</p>
                <div className="flex justify-center mb-3">
                  {qrCode && (
                    <img src={qrCode} alt="MFA QR Code" className="rounded-lg" width={200} height={200} />
                  )}
                </div>
                <p className="text-xs text-[var(--muted)] text-center mb-2">Or enter this code manually:</p>
                <p className="text-center font-mono text-sm text-brand-400 bg-[var(--card)] rounded px-3 py-2 select-all break-all">{mfaSecret}</p>
              </div>

              <form onSubmit={handleMfaVerify}>
                <p className="text-sm font-medium mb-2">2. Enter the 6-digit code from your app to verify:</p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-center text-lg font-mono tracking-[0.3em] text-white outline-none focus:border-brand-500 transition"
                    placeholder="000000"
                    autoFocus
                    required
                  />
                  <button type="submit" disabled={mfaSaving || mfaCode.length !== 6}
                    className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50">
                    {mfaSaving ? "Verifying..." : "Verify"}
                  </button>
                </div>
              </form>

              <button onClick={() => { setMfaEnrolling(false); setQrCode(""); setMfaSecret(""); setMfaCode(""); }}
                className="text-sm text-[var(--muted)] hover:text-white transition">
                Cancel setup
              </button>
            </div>
          )}

          {mfaEnabled && !mfaEnrolling && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm text-[var(--muted)]">Your account is protected with 2FA</span>
              </div>
              <button onClick={handleMfaDisable} disabled={mfaDisabling}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition disabled:opacity-50">
                {mfaDisabling ? "Disabling..." : "Disable 2FA"}
              </button>
            </div>
          )}
        </div>

        {/* Subscription */}
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription</h2>
          {plan === "pro" ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-lg">Pro Plan</p>
                    <p className="text-sm text-[var(--muted)]">$29/month</p>
                  </div>
                  <span className="rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1 text-xs font-medium text-green-400">Active</span>
                </div>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id }) });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:text-white transition"
                >
                  Manage Subscription
                </button>
              </div>
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-xs text-[var(--muted)] mb-3 font-medium">Your plan includes:</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Unlimited fan tracking", "Revenue analytics & charts", "CSV import & export", "Platform tracking", "AI DM scripts", "Best time to message", "Revenue milestones", "Fan LTV estimator", "Retention dashboard", "Smart tag suggestions", "Weekly digest & insights", "Priority support"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <span className="text-green-400">✓</span>
                      <span className="text-[var(--muted)]">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-lg">Free Plan</p>
                  <p className="text-sm text-[var(--muted)]">Up to 25 fans</p>
                </div>
              </div>
              <div className="rounded-lg border border-brand-500/30 bg-brand-500/5 p-4 mb-4">
                <p className="text-sm font-semibold mb-2">Upgrade to Pro</p>
                <p className="text-xs text-[var(--muted)] mb-3">Unlock unlimited fans and premium features:</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {["Unlimited fan tracking", "Revenue analytics & charts", "CSV import & export", "Platform tracking", "AI DM scripts", "Best time to message", "Revenue milestones", "Fan LTV estimator", "Retention dashboard", "Smart tag suggestions", "Weekly digest & insights", "Priority support"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <span className="text-brand-400">+</span>
                      <span className="text-[var(--muted)]">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => handleUpgrade("monthly")} className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
                    Pro Monthly — $29/mo
                  </button>
                  <button onClick={() => handleUpgrade("annual")} className="rounded-lg border border-green-500/50 px-6 py-2.5 text-sm font-medium text-green-400 hover:bg-green-500/10 transition">
                    Pro Annual — $249/yr (save $99)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Export */}
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-1">Export Your Data</h2>
          <p className="text-xs text-[var(--muted)] mb-4">Download all your fan data as a CSV file. Your data belongs to you.</p>
          <button
            onClick={async () => {
              const { data: fans } = await supabase.from("fans").select("*").order("created_at", { ascending: false });
              if (!fans || fans.length === 0) return;
              const headers = ["Name", "Tag", "Total Spent", "Last Message", "Renewal Date", "Notes", "Created At"];
              const rows = fans.map((f: { name: string; tag: string; total_spent: number; last_message_at: string | null; renewal_date: string | null; notes: string; created_at: string }) => [
                f.name, f.tag, String(f.total_spent || 0),
                f.last_message_at || "", f.renewal_date || "",
                `"${(f.notes || "").replace(/"/g, '""')}"`, f.created_at || "",
              ]);
              const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `creatorcrm-export-${new Date().toISOString().split("T")[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-lg bg-brand-500/20 border border-brand-500/30 px-4 py-2 text-sm font-medium text-brand-400 hover:bg-brand-500/30 transition"
          >
            Download CSV Export
          </button>
        </div>

        {/* Share CreatorCRM */}
        <div className="mb-6 rounded-xl border border-brand-500/30 bg-brand-500/5 p-6">
          <h2 className="text-lg font-semibold mb-1">Share CreatorCRM</h2>
          <p className="text-xs text-[var(--muted)] mb-4">Know a creator who could use this? Share the link and help them keep more fans.</p>
          <div className="flex gap-3">
            <input
              type="text" readOnly value="https://creatorcrm.net"
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--muted)] outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText("https://creatorcrm.net");
                const btn = document.getElementById("copy-share-btn");
                if (btn) { btn.textContent = "Copied!"; setTimeout(() => { btn.textContent = "Copy Link"; }, 2000); }
              }}
              id="copy-share-btn"
              className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition whitespace-nowrap"
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Deleting your account will permanently remove all your data, including all fan records. This cannot be undone.
          </p>
          <button
            onClick={async () => {
              const confirmed = window.confirm("Are you absolutely sure? This will permanently delete your account and ALL fan data. This cannot be undone.");
              if (!confirmed) return;
              const doubleConfirm = window.confirm("Last chance! Type OK in the next prompt to delete everything.");
              if (!doubleConfirm) return;
              await supabase.from("fans").delete().eq("creator_id", user!.id);
              await supabase.from("creators").delete().eq("id", user!.id);
              await supabase.auth.signOut();
              router.push("/");
            }}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
          >
            Delete My Account
          </button>
        </div>
      </div>
    </div>
  );
}
