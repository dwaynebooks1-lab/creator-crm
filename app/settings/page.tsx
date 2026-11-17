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

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setName(u.user_metadata?.name || "");

      const { data: creator } = await supabase
        .from("creators").select("plan").eq("id", u.id).single();
      if (creator) setPlan(creator.plan);

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

    // Verify current password first
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

    // Verify current password
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

  async function handleUpgrade() {
    const res = await fetch("/api/checkout", { method: "POST" });
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

        {/* Subscription */}
        <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-semibold mb-4">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{plan === "pro" ? "Pro Plan" : "Free Plan"}</p>
              <p className="text-sm text-[var(--muted)]">{plan === "pro" ? "$49/month — Unlimited fans" : "Up to 25 fans"}</p>
            </div>
            {plan !== "pro" && (
              <button onClick={handleUpgrade} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition">
                Upgrade to Pro
              </button>
            )}
            {plan === "pro" && (
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-500/20 border border-brand-500/30 px-3 py-1 text-sm font-medium text-brand-400">Active</span>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user?.id }) });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white transition"
                >
                  Manage Subscription
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Need to delete your account? Contact support and we&apos;ll handle it for you.
          </p>
        </div>
      </div>
    </div>
  );
}
