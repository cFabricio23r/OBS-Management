import type { AppConfig } from "../../types/config";
import type { TranslationKey } from "../i18n/translations";
import type { ObsSceneItem, ObsState } from "../obs/obsTypes";

export type ValidationIssue = { level: "warning" | "error"; message: string; translationKey?: TranslationKey; values?: Record<string, string | number> };

export const findSequence = (config: AppConfig, sequenceId: string) =>
  Object.values(config.sequences).flat().find((sequence) => sequence.id === sequenceId);

export const validateConfig = (config: AppConfig, obsState?: ObsState, sceneSources: Record<string, ObsSceneItem[]> = {}): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const sceneNames = new Set(obsState?.scenes.map((scene) => scene.sceneName) ?? []);

  Object.entries(config.sequences).forEach(([sceneName, sequences]) => {
    if (obsState && !sceneNames.has(sceneName)) issues.push({ level: "error", message: `Missing OBS scene: ${sceneName}`, translationKey: "missingObsScene", values: { scene: sceneName } });
    const slots = new Map<number, string>();
    sequences.forEach((sequence) => {
      if (sequence.slot) {
        const prior = slots.get(sequence.slot);
        if (prior) issues.push({ level: "warning", message: `Duplicate slot ${sequence.slot} in ${sceneName}: ${prior} and ${sequence.label}`, translationKey: "duplicateSlot", values: { slot: sequence.slot, scene: sceneName, prior, label: sequence.label } });
        slots.set(sequence.slot, sequence.label);
      }
      const sources = new Set((sceneSources[sceneName] ?? []).map((item) => item.sourceName));
      if (sceneSources[sceneName]) {
        sequence.managedSources.forEach((source) => {
          if (!sources.has(source)) issues.push({ level: "error", message: `Missing source in ${sceneName}: ${source}`, translationKey: "missingSource", values: { scene: sceneName, source } });
        });
      }
    });
  });

  config.rundown.forEach((cue) => {
    if (!findSequence(config, cue.sequenceId)) issues.push({ level: "error", message: `Cue points to missing sequence: ${cue.title}`, translationKey: "cueMissingSequence", values: { title: cue.title } });
    if (obsState && !sceneNames.has(cue.sceneName)) issues.push({ level: "error", message: `Cue points to missing scene: ${cue.title} -> ${cue.sceneName}`, translationKey: "cueMissingScene", values: { title: cue.title, scene: cue.sceneName } });
  });

  return issues;
};
