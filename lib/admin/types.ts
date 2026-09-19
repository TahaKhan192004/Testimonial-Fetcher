import type { LeadStatus, PermissionKey, Q1Key, Q2Key, Q3Key, Q4Key } from "../options";

export type ResponseRow = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  business_name: string;
  q1_prior_ai_use: Q1Key;
  q2_focus_area: Q2Key;
  q2_other_text: string | null;
  q3_experience: Q3Key;
  q4_blocker: Q4Key;
  q5_experience_text: string;
  q6_dream_system: string;
  q6_job_title: string | null;
  testimonial_permission: PermissionKey;
  lead_status: LeadStatus;
  admin_notes: string | null;
  suggested_system: string | null;
  tags: string[];
  starred: boolean;
  source: string | null;
  user_agent: string | null;
  submission_ms: number | null;
  flagged_reason: string | null;
};

export type ResponsePatch = Partial<
  Pick<ResponseRow, "lead_status" | "starred" | "admin_notes" | "suggested_system" | "tags">
>;

export type InsightResult = {
  summary: string;
  themes: Array<{ title: string; description: string; mentions?: number; quotes?: string[] }>;
  complaints: Array<{ title: string; description: string; mentions?: number }>;
  requested_systems: Array<{ name: string; description: string; mentions?: number }>;
  offer_ideas: string[];
};

export type InsightRow = {
  id: string;
  created_at: string;
  response_count: number;
  result: InsightResult;
};
