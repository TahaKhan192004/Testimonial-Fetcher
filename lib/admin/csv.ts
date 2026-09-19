import {
  LEAD_STATUS_OPTIONS,
  PERMISSION_OPTIONS,
  Q1_OPTIONS,
  Q2_OPTIONS,
  Q3_OPTIONS,
  Q4_OPTIONS,
  labelFor,
} from "../options";
import type { ResponseRow } from "./types";

/** Quote a cell and neutralise spreadsheet formula injection from user text. */
function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const COLUMNS: Array<[string, (r: ResponseRow) => unknown]> = [
  ["Date", (r) => r.created_at],
  ["Name", (r) => r.name],
  ["Email", (r) => r.email],
  ["Business", (r) => r.business_name],
  ["Q1 Prior AI use", (r) => labelFor(Q1_OPTIONS, r.q1_prior_ai_use)],
  ["Q2 Focus area", (r) => labelFor(Q2_OPTIONS, r.q2_focus_area)],
  ["Q2 Other text", (r) => r.q2_other_text],
  ["Q3 Experience", (r) => labelFor(Q3_OPTIONS, r.q3_experience)],
  ["Q4 Blocker", (r) => labelFor(Q4_OPTIONS, r.q4_blocker)],
  ["Q5 In their words", (r) => r.q5_experience_text],
  ["Q6 Job title", (r) => r.q6_job_title],
  ["Q6 Dream system", (r) => r.q6_dream_system],
  ["Permission", (r) => labelFor(PERMISSION_OPTIONS, r.testimonial_permission)],
  ["Lead status", (r) => labelFor(LEAD_STATUS_OPTIONS, r.lead_status)],
  ["Starred", (r) => (r.starred ? "yes" : "")],
  ["Tags", (r) => r.tags.join("; ")],
  ["Source", (r) => r.source],
  ["Flagged", (r) => r.flagged_reason],
  ["Admin notes", (r) => r.admin_notes],
  ["Suggested system", (r) => r.suggested_system],
];

export function toCsv(rows: ResponseRow[]) {
  const head = COLUMNS.map(([h]) => cell(h)).join(",");
  const body = rows.map((r) => COLUMNS.map(([, get]) => cell(get(r))).join(","));
  // BOM so Excel opens UTF-8 correctly
  return `﻿${[head, ...body].join("\r\n")}\r\n`;
}
