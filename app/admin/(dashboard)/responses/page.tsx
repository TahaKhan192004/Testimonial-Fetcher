import { FilterBar } from "@/components/admin/FilterBar";
import { ResponsesTable } from "@/components/admin/ResponsesTable";
import { PAGE_SIZE, applyFilters, parseFilters } from "@/lib/admin/query";
import type { ResponseRow } from "@/lib/admin/types";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Responses" };

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const supabase = await createClient();

  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, count, error } = await applyFilters(
    supabase.from("feedback_responses").select("*", { count: "exact" }),
    filters,
  )
    .order(filters.sort, { ascending: filters.dir === "asc" })
    .order("id")
    .range(from, from + PAGE_SIZE - 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-cream">Responses</h1>
        <p className="mt-1 text-cream/55">Filter, star, tag and move people through the pipeline.</p>
      </div>
      <FilterBar key={JSON.stringify(filters)} filters={filters} />
      {error ? (
        <p role="alert" className="rounded-xl border border-peach/40 bg-peach/10 p-4 text-sm text-cream">
          Could not load responses. {error.message}
        </p>
      ) : (
        <ResponsesTable
          rows={(data ?? []) as ResponseRow[]}
          total={count ?? 0}
          page={filters.page}
          pageSize={PAGE_SIZE}
          sort={filters.sort}
          dir={filters.dir}
        />
      )}
    </div>
  );
}
