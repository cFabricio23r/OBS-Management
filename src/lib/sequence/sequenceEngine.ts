import type { Sequence } from "../../types/config";
import type { ObsClient } from "../obs/obsClient";

export class SequenceRunner {
  private abortController: AbortController | null = null;

  get running() {
    return Boolean(this.abortController);
  }

  stop() {
    this.abortController?.abort();
    this.abortController = null;
  }

  async runSequence(obs: ObsClient, sequence: Sequence, sceneName = sequence.sceneName) {
    this.stop();
    const controller = new AbortController();
    this.abortController = controller;

    const throwIfStopped = () => {
      if (controller.signal.aborted) throw new Error("Sequence stopped");
    };

    const resolveItems = async () => {
      const items = await obs.getSceneItemList(sceneName);
      return new Map(items.map((item) => [item.sourceName, item.sceneItemId]));
    };

    try {
      for (const step of sequence.steps) {
        throwIfStopped();
        if (step.type === "hide_all") {
          const itemMap = await resolveItems();
          await Promise.all(sequence.managedSources.map((source) => {
            const id = itemMap.get(source);
            return id === undefined ? Promise.resolve() : obs.setSceneItemEnabled(sceneName, id, false);
          }));
        }
        if (step.type === "show" || step.type === "hide") {
          const itemMap = await resolveItems();
          await Promise.all(step.sources.map((source) => {
            const id = itemMap.get(source);
            return id === undefined ? Promise.resolve() : obs.setSceneItemEnabled(sceneName, id, step.type === "show");
          }));
        }
        if (step.type === "restart") {
          await Promise.all(step.sources.map((source) => obs.triggerMediaRestart(source)));
        }
        if (step.type === "wait") {
          await new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(resolve, step.ms);
            controller.signal.addEventListener("abort", () => {
              window.clearTimeout(timeout);
              reject(new Error("Sequence stopped"));
            }, { once: true });
          });
        }
        if (step.type === "preview") await obs.setCurrentPreviewScene(step.sceneName);
        if (step.type === "take") await obs.triggerStudioModeTransition();
      }
    } finally {
      if (this.abortController === controller) this.abortController = null;
    }
  }
}

export const sequenceRunner = new SequenceRunner();
