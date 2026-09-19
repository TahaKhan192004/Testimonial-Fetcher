"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ERRORS: Record<string, string> = {
  not_admin: "You are signed in, but this account is not on the admin list. Ask an admin to add you.",
  auth: "That sign-in link did not work or has expired. Request a new one.",
};

export function LoginForm({ error, configured }: { error?: string; configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [message, setMessage] = useState(error ? (ERRORS[error] ?? "Something went wrong.") : "");

  if (!configured) {
    return <p className="mt-6 text-cream/70">Supabase is not configured. Add the variables from .env.example.</p>;
  }

  const redirectTo = () => `${window.location.origin}/auth/callback?next=/admin`;

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const { error: err } = await createClient().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo(), shouldCreateUser: true },
    });
    if (err) {
      setStatus("idle");
      setMessage(err.message);
    } else {
      setStatus("sent");
    }
  };

  const google = async () => {
    const { error: err } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (err) setMessage(err.message);
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    setMessage("");
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="mt-8">
      {message && (
        <p role="alert" className="mb-5 rounded-xl border border-peach/40 bg-peach/10 p-4 text-sm text-cream">
          {message}
        </p>
      )}
      {error === "not_admin" && (
        <button type="button" onClick={signOut} className="mb-6 text-sm text-peach underline underline-offset-4">
          Sign out and use another account
        </button>
      )}
      {status === "sent" ? (
        <p className="text-cream/80">Check {email} for your sign-in link.</p>
      ) : (
        <form onSubmit={sendLink} className="flex flex-col gap-3">
          <label htmlFor="admin-email" className="text-sm text-cream/70">
            Work email
          </label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-12 rounded-xl border border-cream/20 bg-cream/5 px-4 text-cream focus:border-peach focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="min-h-12 rounded-full bg-terracotta font-semibold text-cream hover:bg-[#8f2533] disabled:opacity-60"
          >
            {status === "sending" ? "Sending..." : "Email me a sign-in link"}
          </button>
          <div className="my-2 flex items-center gap-3 text-xs uppercase tracking-widest text-cream/40">
            <span className="h-px flex-1 bg-cream/15" /> or <span className="h-px flex-1 bg-cream/15" />
          </div>
          <button
            type="button"
            onClick={google}
            className="min-h-12 rounded-full border border-cream/25 font-semibold text-cream hover:border-cream/50"
          >
            Continue with Google
          </button>
        </form>
      )}
    </div>
  );
}
