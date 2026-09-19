"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/responses", label: "Responses" },
  { href: "/admin/insights", label: "Insights" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await fetch("/api/auth/admin-logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cream/10 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/admin" className="font-display text-xl text-cream">
          Feedback <span className="text-peach">admin</span>
        </Link>
        <nav aria-label="Admin" className="flex gap-1">
          {LINKS.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "min-h-10 rounded-full px-4 py-2 text-sm transition-colors",
                  active ? "bg-cream/10 text-cream" : "text-cream/60 hover:text-cream",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm text-cream/55">
          <button type="button" onClick={signOut} className="min-h-10 rounded-full border border-cream/25 px-4 text-cream hover:border-cream/50">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
