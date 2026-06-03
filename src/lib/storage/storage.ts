import localforage from "localforage";
import type { AppConfig, ConnectionSettings } from "../../types/config";
import { appConfigSchema } from "../../schemas/config.schema";

localforage.config({ name: "parish-obs-control", storeName: "dashboard" });

const CONFIG_KEY = "app-config";
const CONNECTION_KEY = "connection-settings";

export const loadConfig = async () => {
  const saved = await localforage.getItem<unknown>(CONFIG_KEY);
  if (!saved) return null;
  return appConfigSchema.parse(saved);
};

export const saveConfig = async (config: AppConfig) => {
  await localforage.setItem(CONFIG_KEY, appConfigSchema.parse(config));
};

export const loadConnectionSettings = async (): Promise<ConnectionSettings | null> => {
  return localforage.getItem<ConnectionSettings>(CONNECTION_KEY);
};

export const saveConnectionSettings = async (settings: ConnectionSettings) => {
  await localforage.setItem(CONNECTION_KEY, settings);
};

export const resetStorage = async () => {
  await localforage.removeItem(CONFIG_KEY);
};
