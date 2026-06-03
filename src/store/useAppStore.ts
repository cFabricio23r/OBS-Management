import { create } from "zustand";
import type { AppConfig, AppLog, Cue, Sequence, SequenceStep } from "../types/config";
import { createSampleConfig, uid } from "../lib/sequence/sequenceTemplates";
import { loadConfig, saveConfig } from "../lib/storage/storage";
import { appConfigSchema } from "../schemas/config.schema";

type AppView = "operator" | "builder" | "settings";
export type Language = "en" | "es";

type AppStore = {
  view: AppView;
  language: Language;
  config: AppConfig;
  selectedCueIndex: number;
  preparedCueId?: string;
  logs: AppLog[];
  toast?: AppLog;
  hydrated: boolean;
  setView: (view: AppView) => void;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  replaceConfig: (config: AppConfig) => Promise<void>;
  resetConfig: () => Promise<void>;
  addLog: (level: AppLog["level"], message: string) => void;
  selectCue: (index: number) => void;
  nextCue: () => void;
  previousCue: () => void;
  markPrepared: (cueId?: string) => void;
  upsertSequence: (sequence: Sequence) => Promise<void>;
  deleteSequence: (sequenceId: string, mode: "remove-cues" | "keep-broken") => Promise<void>;
  duplicateSequence: (sequence: Sequence) => Promise<void>;
  updateSequenceSteps: (sequenceId: string, steps: SequenceStep[]) => Promise<void>;
  upsertCue: (cue: Cue) => Promise<void>;
  deleteCue: (cueId: string) => Promise<void>;
  duplicateCue: (cue: Cue) => Promise<void>;
  reorderRundown: (from: number, to: number) => Promise<void>;
};

const sortSequences = (config: AppConfig) => {
  Object.values(config.sequences).forEach((list) => list.sort((a, b) => (a.slot ?? 99) - (b.slot ?? 99) || a.label.localeCompare(b.label)));
  return config;
};

export const useAppStore = create<AppStore>((set, get) => ({
  view: "operator",
  language: (window.localStorage.getItem("language") as Language | null) ?? "en",
  config: createSampleConfig(),
  selectedCueIndex: 0,
  logs: [],
  hydrated: false,
  setView: (view) => set({ view }),
  setLanguage: (language) => {
    window.localStorage.setItem("language", language);
    set({ language });
  },
  toggleLanguage: () => get().setLanguage(get().language === "en" ? "es" : "en"),
  hydrate: async () => {
    const config = (await loadConfig().catch(() => null)) ?? createSampleConfig();
    set({ config: sortSequences(config), hydrated: true });
  },
  persist: async () => saveConfig(get().config),
  replaceConfig: async (config) => {
    const parsed = sortSequences(appConfigSchema.parse(config));
    set({ config: parsed, selectedCueIndex: 0, preparedCueId: undefined });
    await saveConfig(parsed);
  },
  resetConfig: async () => {
    const config = createSampleConfig();
    set({ config, selectedCueIndex: 0, preparedCueId: undefined });
    await saveConfig(config);
  },
  addLog: (level, message) => {
    const log = { id: uid("log"), level, message, at: Date.now() };
    set((state) => ({ logs: [log, ...state.logs].slice(0, 80), toast: log }));
    window.setTimeout(() => {
      if (get().toast?.id === log.id) set({ toast: undefined });
    }, 3200);
  },
  selectCue: (index) => set((state) => ({ selectedCueIndex: Math.max(0, Math.min(index, state.config.rundown.length - 1)) })),
  nextCue: () => get().selectCue(get().selectedCueIndex + 1),
  previousCue: () => get().selectCue(get().selectedCueIndex - 1),
  markPrepared: (cueId) => set({ preparedCueId: cueId }),
  upsertSequence: async (sequence) => {
    const config = structuredClone(get().config);
    const list = config.sequences[sequence.sceneName] ?? [];
    const existingIndex = list.findIndex((item) => item.id === sequence.id);
    if (existingIndex >= 0) list[existingIndex] = sequence;
    else list.push(sequence);
    config.sequences[sequence.sceneName] = list;
    set({ config: sortSequences(config) });
    await get().persist();
  },
  deleteSequence: async (sequenceId, mode) => {
    const config = structuredClone(get().config);
    Object.keys(config.sequences).forEach((sceneName) => {
      config.sequences[sceneName] = config.sequences[sceneName].filter((sequence) => sequence.id !== sequenceId);
    });
    if (mode === "remove-cues") config.rundown = config.rundown.filter((cue) => cue.sequenceId !== sequenceId);
    set({ config });
    await get().persist();
  },
  duplicateSequence: async (sequence) => {
    await get().upsertSequence({ ...structuredClone(sequence), id: uid("seq"), label: `${sequence.label} copy`, slot: undefined });
  },
  updateSequenceSteps: async (sequenceId, steps) => {
    const sequence = Object.values(get().config.sequences).flat().find((item) => item.id === sequenceId);
    if (sequence) await get().upsertSequence({ ...sequence, steps });
  },
  upsertCue: async (cue) => {
    const config = structuredClone(get().config);
    const index = config.rundown.findIndex((item) => item.id === cue.id);
    if (index >= 0) config.rundown[index] = cue;
    else config.rundown.push(cue);
    set({ config });
    await get().persist();
  },
  deleteCue: async (cueId) => {
    const config = structuredClone(get().config);
    config.rundown = config.rundown.filter((cue) => cue.id !== cueId);
    set({ config, selectedCueIndex: Math.min(get().selectedCueIndex, Math.max(0, config.rundown.length - 1)) });
    await get().persist();
  },
  duplicateCue: async (cue) => get().upsertCue({ ...cue, id: uid("cue"), title: `${cue.title} copy` }),
  reorderRundown: async (from, to) => {
    const config = structuredClone(get().config);
    const [item] = config.rundown.splice(from, 1);
    config.rundown.splice(to, 0, item);
    set({ config, selectedCueIndex: to });
    await get().persist();
  },
}));
