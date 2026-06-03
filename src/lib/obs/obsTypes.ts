export type ObsScene = { sceneName: string; sceneIndex?: number };
export type ObsSceneItem = {
  sceneItemId: number;
  sourceName: string;
  sceneItemEnabled: boolean;
};

export type ObsState = {
  scenes: ObsScene[];
  programScene?: string;
  previewScene?: string;
  studioModeEnabled: boolean;
};
