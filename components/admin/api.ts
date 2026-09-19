import type { ResponsePatch, ResponseRow } from "@/lib/admin/types";

export async function patchResponses(ids: string[], patch: ResponsePatch): Promise<ResponseRow[]> {
  const res = await fetch("/api/admin/responses", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, patch }),
  });
  if (!res.ok) throw new Error("Update failed");
  const json = (await res.json()) as { rows: ResponseRow[] };
  return json.rows;
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
