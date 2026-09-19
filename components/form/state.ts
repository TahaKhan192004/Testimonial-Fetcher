import type { PermissionKey, Q1Key, Q2Key, Q3Key, Q4Key } from "@/lib/options";
import { emailSchema } from "@/lib/schema";

export const STORAGE_KEY = "asf-feedback-v1";
export const UNLOCK_KEY = "asf-unlock-v1";
export const LAST_STEP = 9;
/** Stages that fill the lock: contact, Q1 to Q6, permission. */
export const TOTAL_STAGES = 8;

export type FormState = {
  step: number;
  /** 1 = forward, -1 = back. Drives the slide direction. */
  dir: 1 | -1;
  sessionId: string;
  startedAt: number;
  src: string;
  name: string;
  email: string;
  business: string;
  q1: Q1Key | null;
  q2: Q2Key | null;
  q2Other: string;
  q3: Q3Key | null;
  q4: Q4Key | null;
  q5: string;
  q6Title: string;
  q6: string;
  permission: PermissionKey | null;
};

export type Action =
  | { type: "hydrate"; state: Partial<FormState> }
  | { type: "set"; patch: Partial<FormState> }
  | { type: "go"; step: number };

export function initialState(): FormState {
  return {
    step: 0,
    dir: 1,
    sessionId: "",
    startedAt: 0,
    src: "",
    name: "",
    email: "",
    business: "",
    q1: null,
    q2: null,
    q2Other: "",
    q3: null,
    q4: null,
    q5: "",
    q6Title: "",
    q6: "",
    permission: null,
  };
}

export function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state };
    case "set":
      return { ...state, ...action.patch };
    case "go":
      return { ...state, step: action.step, dir: action.step >= state.step ? 1 : -1 };
  }
}

export function contactComplete(s: FormState) {
  return s.name.trim().length > 0 && emailSchema.safeParse(s.email).success && s.business.trim().length > 0;
}

/** Whether the person may leave `step` going forward. */
export function canAdvance(s: FormState, step: number): boolean {
  switch (step) {
    case 0:
      return true;
    case 1:
      return contactComplete(s);
    case 2:
      return s.q1 !== null;
    case 3:
      return s.q2 !== null && (s.q2 !== "other" || s.q2Other.trim().length > 0);
    case 4:
      return s.q3 !== null;
    case 5:
      return s.q4 !== null;
    case 6:
      return s.q5.trim().length >= 10;
    case 7:
      return s.q6.trim().length >= 10;
    case 8:
      return s.permission !== null;
    default:
      return false;
  }
}

/** Lock fill, 0 to 100. Counts answered stages, not the current position. */
export function progressPercent(s: FormState) {
  const done = [
    contactComplete(s),
    s.q1 !== null,
    s.q2 !== null && (s.q2 !== "other" || s.q2Other.trim().length > 0),
    s.q3 !== null,
    s.q4 !== null,
    s.q5.trim().length >= 10,
    s.q6.trim().length >= 10,
    s.permission !== null,
  ].filter(Boolean).length;
  return Math.round((done / TOTAL_STAGES) * 100);
}

export const newSessionId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" | "duplicate"; accessUrl: string | null }
  | { status: "error"; message: string };
