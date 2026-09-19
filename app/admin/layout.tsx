import type { Metadata } from "next";

// Everything under /admin is noindex. The proxy adds the same header.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Feedback admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
