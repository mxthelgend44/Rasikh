// src/shared/types.ts  (complete — the authoritative shared contracts the whole codebase imports)

// ---- Modes and identity ----
export type Mode = "guide";
export type Level = "beginner" | "intermediate" | "advanced";
export type Risk = "safe" | "confirm"; // "confirm" is advisory only: the person always does the action
export type Language = "en" | "ar";

// ---- Messaging ----
export interface Envelope<T = unknown> {
  id: string;
  replyTo?: string;
  source: "panel" | "worker" | "content" | "offscreen";
  target: "panel" | "worker" | "content" | "offscreen";
  tabId?: number;
  type: string;
  payload: T;
  ts: number;
}

export interface PinAddress {
  node: string;
  pin: string;
}

// ---- Perception ----
export interface ElementState {
  disabled?: boolean;
  checked?: boolean;
  expanded?: boolean;
  selected?: boolean;
  focused?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UIElement {
  ref: string; // stable within one perception, e.g. "e12"
  fingerprint: string; // stable across perceptions, used to match the same control turn to turn
  role: string;
  name: string; // accessible name
  // Rasikh never reads or sends a field value. Structure only: the label is the accessible name.
  sensitive?: boolean; // personal-data field: described by its label only (no type, placeholder, required)
  inputType?: string; // e.g. "text", "email", "select"; omitted for sensitive fields
  required?: boolean; // omitted for sensitive fields
  placeholder?: string; // omitted for sensitive fields
  state?: ElementState;
  offscreen?: boolean;
  rect: Rect; // viewport CSS pixels
  frame?: number;
}

export interface A11yNode {
  ref?: string;
  role: string;
  name?: string;
  children: A11yNode[];
}

export interface FrameInfo {
  index: number;
  origin: string;
  crossOrigin: boolean;
  rect: Rect;
}

export interface Viewport {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  dpr: number;
  zoom: number;
}

export interface PageModel {
  url: string;
  title: string;
  site: string; // resolved skill pack id, set by the resolver
  view: string; // resolved view signature, set by the resolver
  partial: boolean; // true if the node budget was exhausted
  viewport: Viewport;
  elements: UIElement[];
  tree?: A11yNode;
  salientText: string;
  frames?: FrameInfo[];
  capturedAt: number;
}

// ---- Actions ----
// Coach, do not do: every action is non-mutating. There is deliberately no click, type, select,
// submit or navigate action. src/content/actions/executor.ts and the guard tests enforce this.
export type ActionType =
  | "explain"
  | "highlight"
  | "ask"
  | "checkUnderstanding"
  | "scrollTo"
  | "waitFor"
  | "recordProgress"
  | "clearOverlays";
export const COACH_ACTIONS: readonly ActionType[] = [
  "explain",
  "highlight",
  "ask",
  "checkUnderstanding",
  "scrollTo",
  "waitFor",
  "recordProgress",
  "clearOverlays"
];

export interface AgentAction {
  type: ActionType;
  ref?: string;
  text?: string;
  message?: string;
  prompt?: string;
  verify?: string;
  question?: string;
  choices?: string[];
  timeout?: number;
  objectiveId?: string;
  status?: string;
  risk?: Risk;
  turnId?: string;
}

export interface ActionResult {
  action: ActionType;
  ref?: string;
  ok: boolean;
  failureCode?: string;
  message?: string;
  newModel: PageModel;
}

// ---- Orchestration ----
export interface TurnDigest {
  role: "tutor" | "student" | "system";
  text: string;
  ts: number;
}

export interface LearnerSnapshot {
  level: Level;
  taskMastery: Record<string, number>;
}

export interface TurnRequest {
  sessionId: string;
  turnId: string;
  skill: string;
  objective: string;
  mode: Mode;
  step: number; // zero based index into the task's steps; the person advances it
  studentLanguage?: Language;
  pageModel: PageModel;
  lastActionResult?: ActionResult;
  history: TurnDigest[];
  learnerSnapshot: LearnerSnapshot;
}

export interface TurnResponse {
  turnId: string;
  message: string;
  action: AgentAction;
  risk: Risk;
  objectiveStatus: string;
  expectVerify?: string;
  provider: Provider; // "demo" = deterministic offline guide, "ai" = optional LLM path
  step: StepInfo;
}
export type Provider = "demo" | "ai";
export interface StepInfo {
  index: number;
  total: number;
  id: string;
  title: string;
  instruction: string;
  tip?: string;
  controlFound: boolean;
  complete: boolean; // the step's structural verify condition holds on the page now
}

// ---- Skill packs ----
export interface SelectorLayer {
  kind: "testid" | "roleName" | "textInRegion" | "structural";
  value: string;
}
export interface ControlRef {
  key: string;
  selectors: SelectorLayer[];
}
export interface ViewDef {
  signature: ControlRef[];
  controls: ControlRef[];
}
export interface TaskStep {
  id: string;
  title?: string;
  titleAr?: string;
  instruction: string;
  instructionAr?: string;
  tipAr?: string;
  controlKey?: string;
  verify?: string;
  pitfalls?: string[];
  risk: Risk;
  requireRobustInput?: boolean;
  allowDemo?: boolean;
  last?: boolean;
  notes?: string;
}
export interface TaskGraph {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  objectiveRef?: string;
  steps: TaskStep[];
}
export interface RiskRule {
  match: string; // regex matched against the control's accessible name, or an exact ref
  level: Risk;
}
export interface SkillPack {
  id: string;
  name?: string;
  nameAr?: string;
  status?: string; // e.g. "draft-unverified" for real sites, "mock" for the local mock portals
  version: string;
  urlPatterns: string[];
  allowedDomains: string[];
  views: Record<string, ViewDef>;
  glossary: Record<string, string>;
  glossaryAr?: Record<string, string>;
  tasks: TaskGraph[];
  riskPolicy: RiskRule[];
}

// ---- Objective ----
export interface Objective {
  id: string;
  courseId: string;
  title: string;
  description: string;
  skill: string;
  taskId: string;
}

// ---- Persisted app state ----
export interface AppState {
  language?: Language;
  lesson?: {
    skill: string;
    objective: string;
    mode: Mode;
    step: number;
    total?: number;
    history: TurnDigest[];
    state: LessonState;
    expectVerify?: string;
  };
}

export type LessonState =
  | "idle"
  | "starting"
  | "awaiting-plan"
  | "coaching"
  | "awaiting-student-action"
  | "awaiting-confirmation"
  | "acting"
  | "verifying"
  | "paused"
  | "completed"
  | "failed";

