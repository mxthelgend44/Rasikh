// src/panel/state/store.ts
import { create } from "zustand";
import type { Provider, StepInfo } from "../../shared/types";
import type { Lang } from "../i18n";
import type { PackSummary } from "../../background/orchestratorClient";

interface PanelState {
  lang: Lang;
  provider: Provider;
  packs: PackSummary[];
  packsError: boolean;
  tabUrl: string;
  granted: boolean;
  active: boolean; // a guide is running
  objective: string;
  step: StepInfo | null;
  message: string;
  error: string;
  setLang: (l: Lang) => void;
  setPacks: (provider: Provider, packs: PackSummary[]) => void;
  setPacksError: () => void;
  setAccess: (tabUrl: string, granted: boolean) => void;
  setGuide: (s: { step: StepInfo; message: string; provider: Provider }) => void;
  setActive: (active: boolean, objective?: string) => void;
  setError: (code: string) => void;
}

export const useStore = create<PanelState>((set) => ({
  lang: "en",
  provider: "demo",
  packs: [],
  packsError: false,
  tabUrl: "",
  granted: false,
  active: false,
  objective: "",
  step: null,
  message: "",
  error: "",
  setLang: (lang) => set({ lang }),
  setPacks: (provider, packs) => set({ provider, packs, packsError: false }),
  setPacksError: () => set({ packsError: true }),
  setAccess: (tabUrl, granted) => set({ tabUrl, granted }),
  setGuide: ({ step, message, provider }) => set({ step, message, provider, active: true, error: "" }),
  setActive: (active, objective = "") => set(active ? { active, objective } : { active, objective: "", step: null, message: "" }),
  setError: (error) => set({ error })
}));
