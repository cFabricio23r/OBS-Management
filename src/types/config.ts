export type SequenceStep =
  | { type: "hide_all" }
  | { type: "show"; sources: string[] }
  | { type: "hide"; sources: string[] }
  | { type: "restart"; sources: string[] }
  | { type: "wait"; ms: number }
  | { type: "preview"; sceneName: string }
  | { type: "take" };

export type Sequence = {
  id: string;
  sceneName: string;
  label: string;
  slot?: number;
  managedSources: string[];
  steps: SequenceStep[];
};

export type Cue = {
  id: string;
  title: string;
  sceneName: string;
  sequenceId: string;
  note?: string;
};

export type AppConfig = {
  sequences: Record<string, Sequence[]>;
  rundown: Cue[];
};

export type ConnectionSettings = {
  url: string;
  password: string;
};

export type LogLevel = "info" | "success" | "warning" | "error";

export type AppLog = {
  id: string;
  level: LogLevel;
  message: string;
  at: number;
};
