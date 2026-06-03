import { create } from "zustand";
import type { ConnectionSettings } from "../types/config";
import { obsClient } from "../lib/obs/obsClient";
import type { ObsSceneItem, ObsState } from "../lib/obs/obsTypes";
import { loadConnectionSettings, saveConnectionSettings } from "../lib/storage/storage";

type ObsStore = {
  connected: boolean;
  connecting: boolean;
  error?: string;
  settings: ConnectionSettings;
  state: ObsState;
  sceneSources: Record<string, ObsSceneItem[]>;
  hydrateSettings: () => Promise<void>;
  connect: (settings: ConnectionSettings) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshState: () => Promise<void>;
  loadSceneSources: (sceneName: string) => Promise<ObsSceneItem[]>;
};

export const useObsStore = create<ObsStore>((set, get) => ({
  connected: false,
  connecting: false,
  settings: { url: "ws://127.0.0.1:4455", password: "" },
  state: { scenes: [], studioModeEnabled: false },
  sceneSources: {},
  hydrateSettings: async () => {
    const settings = await loadConnectionSettings().catch(() => null);
    if (settings) set({ settings });
  },
  connect: async (settings) => {
    set({ connecting: true, error: undefined });
    try {
      await obsClient.connect(settings.url, settings.password);
      await saveConnectionSettings(settings);
      set({ connected: true, settings, connecting: false });
      await get().refreshState();
    } catch (error) {
      set({ connected: false, connecting: false, error: error instanceof Error ? error.message : "Unable to connect to OBS" });
      throw error;
    }
  },
  disconnect: async () => {
    await obsClient.disconnect().catch(() => undefined);
    set({ connected: false, state: { scenes: [], studioModeEnabled: false } });
  },
  refreshState: async () => {
    const state = await obsClient.refreshState();
    set({ state });
  },
  loadSceneSources: async (sceneName) => {
    const sources = await obsClient.getSceneItemList(sceneName);
    set((state) => ({ sceneSources: { ...state.sceneSources, [sceneName]: sources } }));
    return sources;
  },
}));
