import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DetailPanel } from "@/components/admin/DetailPanel";
import type { ResponseRow } from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Response" };

export default async function ResponseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const { data } = await supabase.from("feedback_responses").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/responses" className="text-sm text-cream/55 underline underline-offset-4 hover:text-cream">
        &larr; All responses
      </Link>
      <div className="mt-6">
        <DetailPanel row={data as ResponseRow} />
      </div>
    </div>
  );
}
