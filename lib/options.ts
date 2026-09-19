/**
 * Single source of truth for every answer key and label.
 * The form, the DB check constraints (supabase/migrations) and the admin
 * charts all read from here, so they cannot drift.
 */

export type Option<K extends string = string> = {
  key: K;
  label: string;
  short?: string;
};

export const Q1_OPTIONS = [
  { key: "barely_using", label: "Barely using AI", short: "Barely using" },
  { key: "chat_content", label: "Using ChatGPT or similar for content and ideas", short: "Chat and content" },
  { key: "regular_manual", label: "Using AI regularly, but everything is manual", short: "Regular, manual" },
  { key: "basic_automations", label: "Running a few basic automations", short: "Basic automations" },
  { key: "experimenting_agents", label: "Experimenting with agents and workflows", short: "Agents and workflows" },
] as const satisfies readonly Option[];

export const Q2_OPTIONS = [
  { key: "lead_gen", label: "Lead generation", short: "Lead gen" },
  { key: "sales_followup", label: "Sales and follow-up", short: "Sales follow-up" },
  { key: "content_branding", label: "Content and branding", short: "Content" },
  { key: "onboarding_delivery", label: "Client onboarding and delivery", short: "Onboarding" },
  { key: "operations_admin", label: "Operations and admin", short: "Ops and admin" },
  { key: "customer_support", label: "Customer support", short: "Support" },
  { key: "reporting_decisions", label: "Reporting and decisions", short: "Reporting" },
  { key: "other", label: "Something else", short: "Other" },
] as const satisfies readonly Option[];

export const Q3_OPTIONS = [
  { key: "understand_ai_in_business", label: "I finally understand how AI fits into my business", short: "Understand AI" },
  { key: "new_use_cases", label: "I found use cases I had not thought of", short: "New use cases" },
  { key: "started_building", label: "I started building something", short: "Started building" },
  { key: "more_confident", label: "I feel more confident using AI", short: "More confident" },
  { key: "need_help_implementing", label: "I get it, but I need help implementing it", short: "Need help" },
  { key: "no_change", label: "Nothing really changed for me", short: "No change" },
] as const satisfies readonly Option[];

export const Q4_OPTIONS = [
  { key: "what_to_automate", label: "I am not sure what to automate", short: "What to automate" },
  { key: "dont_know_how", label: "I do not know how to build it", short: "Do not know how" },
  { key: "technical_setup", label: "The technical setup is too much", short: "Technical setup" },
  { key: "no_time", label: "I do not have the time", short: "No time" },
  { key: "unreliable", label: "AI feels unreliable", short: "Unreliable" },
  { key: "want_done_for_me", label: "I would rather have someone build it for me", short: "Done for me" },
  { key: "nothing_major", label: "Nothing major, I am good", short: "Nothing major" },
] as const satisfies readonly Option[];

export const PERMISSION_OPTIONS = [
  { key: "named", label: "Yes, use my name", short: "Named" },
  { key: "anonymous", label: "Yes, keep me anonymous", short: "Anonymous" },
  { key: "no", label: "No, keep it private", short: "Private" },
] as const satisfies readonly Option[];

export const LEAD_STATUS_OPTIONS = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "call_booked", label: "Call booked" },
  { key: "won", label: "Won" },
  { key: "not_a_fit", label: "Not a fit" },
] as const satisfies readonly Option[];

type Keys<T extends readonly Option[]> = T[number]["key"];
export type Q1Key = Keys<typeof Q1_OPTIONS>;
export type Q2Key = Keys<typeof Q2_OPTIONS>;
export type Q3Key = Keys<typeof Q3_OPTIONS>;
export type Q4Key = Keys<typeof Q4_OPTIONS>;
export type PermissionKey = Keys<typeof PERMISSION_OPTIONS>;
export type LeadStatus = Keys<typeof LEAD_STATUS_OPTIONS>;

const keysOf = <T extends readonly Option[]>(o: T) => o.map((x) => x.key) as unknown as [Keys<T>, ...Keys<T>[]];
export const Q1_KEYS = keysOf(Q1_OPTIONS);
export const Q2_KEYS = keysOf(Q2_OPTIONS);
export const Q3_KEYS = keysOf(Q3_OPTIONS);
export const Q4_KEYS = keysOf(Q4_OPTIONS);
export const PERMISSION_KEYS = keysOf(PERMISSION_OPTIONS);
export const LEAD_STATUS_KEYS = keysOf(LEAD_STATUS_OPTIONS);

export function labelFor(options: readonly Option[], key: string | null | undefined, kind: "label" | "short" = "label") {
  if (!key) return "";
  const o = options.find((x) => x.key === key);
  return o ? (kind === "short" ? (o.short ?? o.label) : o.label) : key;
}

/** Blockers that mean the person is a sales conversation, not just a tester. */
export const HOT_BLOCKERS: Q4Key[] = ["want_done_for_me", "no_time", "technical_setup"];
/** Blockers counted in the "wants done-for-me help" stat. */
export const DONE_FOR_ME_BLOCKERS: Q4Key[] = ["want_done_for_me", "no_time"];

export const ANSWER_FIELDS = {
  q1: { column: "q1_prior_ai_use", title: "Prior AI use", options: Q1_OPTIONS },
  q2: { column: "q2_focus_area", title: "Focus area", options: Q2_OPTIONS },
  q3: { column: "q3_experience", title: "Experience", options: Q3_OPTIONS },
  q4: { column: "q4_blocker", title: "Blocker", options: Q4_OPTIONS },
} as const;

/** Form step order, shared by the form shell and the drop-off funnel. */
export const STEP_NAMES = [
  "Welcome",
  "Contact",
  "Q1 Prior AI use",
  "Q2 Focus area",
  "Q3 Experience",
  "Q4 Blocker",
  "Q5 In your words",
  "Q6 Advice to others",
  "Submit",
] as const;
