import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-ring">AI Savvy Founders</p>
      <h1 className="font-display text-4xl text-cream">Admin sign in</h1>
      <LoginForm />
    </main>
  );
}
