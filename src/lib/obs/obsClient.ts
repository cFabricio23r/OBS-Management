import OBSWebSocket from "obs-websocket-js";
import type { ObsScene, ObsSceneItem, ObsState } from "./obsTypes";

export class ObsClient {
  private obs = new OBSWebSocket();

  async connect(url: string, password?: string) {
    await this.obs.connect(url, password || undefined);
  }

  async disconnect() {
    await this.obs.disconnect();
  }

  async getVersion() {
    return this.obs.call("GetVersion");
  }

  async getStudioModeEnabled() {
    const response = await this.obs.call("GetStudioModeEnabled");
    return Boolean((response as { studioModeEnabled: boolean }).studioModeEnabled);
  }

  async getSceneList() {
    const response = await this.obs.call("GetSceneList");
    return ((response as unknown) as { scenes: ObsScene[] }).scenes ?? [];
  }

  async getCurrentProgramScene() {
    const response = await this.obs.call("GetCurrentProgramScene");
    return (response as { currentProgramSceneName: string }).currentProgramSceneName;
  }

  async getCurrentPreviewScene() {
    const response = await this.obs.call("GetCurrentPreviewScene");
    return (response as { currentPreviewSceneName: string }).currentPreviewSceneName;
  }

  async setCurrentPreviewScene(sceneName: string) {
    await this.obs.call("SetCurrentPreviewScene", { sceneName });
  }

  async triggerStudioModeTransition() {
    await this.obs.call("TriggerStudioModeTransition");
  }

  async getSceneItemList(sceneName: string) {
    const response = await this.obs.call("GetSceneItemList", { sceneName });
    return (response as { sceneItems: ObsSceneItem[] }).sceneItems ?? [];
  }

  async setSceneItemEnabled(sceneName: string, sceneItemId: number, enabled: boolean) {
    await this.obs.call("SetSceneItemEnabled", { sceneName, sceneItemId, sceneItemEnabled: enabled });
  }

  async triggerMediaRestart(inputName: string) {
    await this.obs.call("TriggerMediaInputAction", { inputName, mediaAction: "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART" });
  }

  async refreshState(): Promise<ObsState> {
    const [scenes, studioModeEnabled, programScene] = await Promise.all([
      this.getSceneList(),
      this.getStudioModeEnabled().catch(() => false),
      this.getCurrentProgramScene().catch(() => undefined),
    ]);
    const previewScene = studioModeEnabled ? await this.getCurrentPreviewScene().catch(() => undefined) : undefined;
    return { scenes, programScene, previewScene, studioModeEnabled };
  }
}

export const obsClient = new ObsClient();
