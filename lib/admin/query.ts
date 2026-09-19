import { HOT_BLOCKERS } from "../options";

export const PAGE_SIZE = 25;

type SP = Record<string, string | string[] | undefined>;

export type ResponseFilters = {
  q: string;
  from: string;
  to: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  permission: string;
  lead: string;
  starred: boolean;
  other: boolean;
  flagged: boolean;
  tag: string;
  view: string;
  sort: "created_at" | "name" | "business_name";
  dir: "asc" | "desc";
  page: number;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter((x) => /^[a-z_]+$/.test(x));

export function parseFilters(sp: SP): ResponseFilters {
  const sort = first(sp.sort);
  return {
    q: first(sp.q).trim().slice(0, 100),
    from: isDate(first(sp.from)) ? first(sp.from) : "",
    to: isDate(first(sp.to)) ? first(sp.to) : "",
    q1: csv(first(sp.q1)).join(","),
    q2: csv(first(sp.q2)).join(","),
    q3: csv(first(sp.q3)).join(","),
    q4: csv(first(sp.q4)).join(","),
    permission: csv(first(sp.permission)).join(","),
    lead: csv(first(sp.lead)).join(","),
    starred: first(sp.starred) === "1",
    other: first(sp.other) === "1",
    flagged: first(sp.flagged) === "1",
    tag: first(sp.tag).trim().slice(0, 40),
    view: ["hot", "testimonials", "unhappy"].includes(first(sp.view)) ? first(sp.view) : "",
    sort: sort === "name" || sort === "business_name" ? sort : "created_at",
    dir: first(sp.dir) === "asc" ? "asc" : "desc",
    page: Math.max(1, Number.parseInt(first(sp.page), 10) || 1),
  };
}

/** Rebuild a query string from filters, dropping empties and (optionally) paging. */
export function filtersToParams(f: ResponseFilters, opts: { page?: boolean } = {}) {
  const p = new URLSearchParams();
  const put = (k: string, v: string | boolean | number) => {
    if (v === "" || v === false) return;
    p.set(k, v === true ? "1" : String(v));
  };
  put("q", f.q);
  put("from", f.from);
  put("to", f.to);
  put("q1", f.q1);
  put("q2", f.q2);
  put("q3", f.q3);
  put("q4", f.q4);
  put("permission", f.permission);
  put("lead", f.lead);
  put("starred", f.starred);
  put("other", f.other);
  put("flagged", f.flagged);
  put("tag", f.tag);
  put("view", f.view);
  if (f.sort !== "created_at") put("sort", f.sort);
  if (f.dir !== "desc") put("dir", f.dir);
  if (opts.page && f.page > 1) put("page", f.page);
  return p;
}

const SEARCH_COLUMNS = [
  "name",
  "email",
  "business_name",
  "q5_experience_text",
  "q6_recommendation",
  "q2_other_text",
  "admin_notes",
];

/** Applies every filter to a PostgREST select builder. Ignores paging and sort. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters<T extends { [k: string]: any }>(query: T, f: ResponseFilters): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let qb: any = query;
  const inList = (col: string, v: string) => {
    const list = v.split(",").filter(Boolean);
    if (list.length === 1) qb = qb.eq(col, list[0]);
    else if (list.length > 1) qb = qb.in(col, list);
  };

  if (f.from) qb = qb.gte("created_at", `${f.from}T00:00:00.000Z`);
  if (f.to) qb = qb.lte("created_at", `${f.to}T23:59:59.999Z`);
  inList("q1_prior_ai_use", f.q1);
  inList("q2_focus_area", f.q2);
  inList("q3_experience", f.q3);
  inList("q4_blocker", f.q4);
  inList("testimonial_permission", f.permission);
  inList("lead_status", f.lead);
  if (f.starred) qb = qb.eq("starred", true);
  if (f.other) qb = qb.not("q2_other_text", "is", null);
  if (f.flagged) qb = qb.not("flagged_reason", "is", null);
  if (f.tag) qb = qb.contains("tags", [f.tag]);

  if (f.view === "hot") qb = qb.in("q4_blocker", HOT_BLOCKERS).eq("lead_status", "new");
  if (f.view === "testimonials") qb = qb.in("testimonial_permission", ["named", "anonymous"]);
  if (f.view === "unhappy") qb = qb.or("q3_experience.eq.no_change,q4_blocker.eq.unreliable");

  const term = f.q.replace(/[%,()*\\]/g, " ").trim();
  if (term) qb = qb.or(SEARCH_COLUMNS.map((c) => `${c}.ilike.%${term}%`).join(","));

  return qb as T;
}

/** Pulls every row past PostgREST's 1000 row default. */
export async function fetchAll<T>(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const out: T[] = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await makeQuery(from, from + size - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  return out;
}

export const SAVED_VIEWS = [
  { id: "", label: "All responses" },
  { id: "hot", label: "Hot leads" },
  { id: "testimonials", label: "Testimonials" },
  { id: "unhappy", label: "Unhappy" },
] as const;
