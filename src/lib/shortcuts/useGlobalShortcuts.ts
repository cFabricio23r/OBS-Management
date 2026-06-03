import { useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";
import { useObsStore } from "../../store/useObsStore";
import { obsClient } from "../obs/obsClient";
import { findSequence } from "../sequence/validators";
import { sequenceRunner } from "../sequence/sequenceEngine";

const isTypingTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
};

export const useGlobalShortcuts = () => {
  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      const app = useAppStore.getState();
      const obs = useObsStore.getState();

      if (event.key === "Escape" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
        return;
      }
      if (isTypingTarget(event.target)) return;

      const currentCue = app.config.rundown[app.selectedCueIndex];
      const currentPreview = obs.state.previewScene;
      const digit = Number(event.key);

      try {
        if (event.code === "Space") {
          event.preventDefault();
          if (!currentCue) return;
          const sequence = findSequence(app.config, currentCue.sequenceId);
          await obsClient.setCurrentPreviewScene(currentCue.sceneName);
          await useObsStore.getState().refreshState();
          if (sequence) {
            await sequenceRunner.runSequence(obsClient, sequence, currentCue.sceneName);
            app.markPrepared(currentCue.id);
            app.addLog("success", `Previewing ${currentCue.title}`);
          } else app.addLog("warning", `Missing sequence for ${currentCue.title}`);
        }
        if (event.key.toLowerCase() === "t") {
          if (currentCue) {
            const sequence = findSequence(app.config, currentCue.sequenceId);
            if (!sequence) {
              app.addLog("warning", `Missing sequence for ${currentCue.title}`);
              return;
            }
            await obsClient.setCurrentPreviewScene(currentCue.sceneName);
            await obs.refreshState();
            await sequenceRunner.runSequence(obsClient, sequence, currentCue.sceneName);
            app.markPrepared(currentCue.id);
            await obsClient.triggerStudioModeTransition();
            await obs.refreshState();
            app.addLog("success", `Took ${sequence.label}`);
          } else {
            await obsClient.triggerStudioModeTransition();
            await obs.refreshState();
            app.addLog("success", "Transition triggered");
          }
        }
        if (event.key === "ArrowDown" || event.key.toLowerCase() === "n") app.nextCue();
        if (event.key === "ArrowUp" || event.key.toLowerCase() === "b") app.previousCue();
        if (event.key.toLowerCase() === "r") await obs.refreshState().then(() => app.addLog("success", "OBS state refreshed"));
        if (event.key.toLowerCase() === "x") {
          sequenceRunner.stop();
          app.addLog("warning", "Running sequence stopped");
        }
        if (digit >= 1 && digit <= 9) {
          if (event.shiftKey) {
            const scene = obs.state.scenes[digit - 1]?.sceneName;
            if (scene) await obsClient.setCurrentPreviewScene(scene).then(() => obs.refreshState());
          } else if (currentPreview) {
            const sequence = (app.config.sequences[currentPreview] ?? []).find((item) => item.slot === digit);
            if (sequence) await sequenceRunner.runSequence(obsClient, sequence, currentPreview).then(() => app.addLog("success", `Ran ${sequence.label}`));
          }
        }
      } catch (error) {
        app.addLog("error", error instanceof Error ? error.message : "Shortcut failed");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};
