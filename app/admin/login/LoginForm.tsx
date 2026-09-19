"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      setError(json.message ?? "Could not sign in.");
    } catch {
      setError("Connection problem. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-xl border border-peach/40 bg-peach/10 p-4 text-sm text-cream">
          {error}
        </p>
      )}
      <label htmlFor="admin-password" className="text-sm text-cream/70">
        Password
      </label>
      <input
        id="admin-password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="min-h-12 rounded-xl border border-cream/20 bg-cream/5 px-4 text-cream focus:border-peach focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || !password}
        className="min-h-12 rounded-full bg-terracotta font-semibold text-cream hover:bg-[#8f2533] disabled:bg-cream/10 disabled:text-cream/40"
      >
        {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
